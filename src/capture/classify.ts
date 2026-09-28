import type { PdpSignals } from "./normalize";

export type PageClassification =
  | "product"
  | "homepage"
  | "category"
  | "error"
  | "unknown";

export type DetectionInput = {
  url: string;
  statusCode?: number;
  blocked?: boolean;
  title?: string;
  content: string;
  jsonLd: unknown[];
  signals: PdpSignals;
};

export type DetectionResult = {
  classification: PageClassification;
  isPdp: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  score: number;
};

const PRODUCT_PATH =
  /\/(product|products|p|dp|item|items|sku|goods|productpage)\b/i;
const CATEGORY_PATH =
  /\/(categor|collection|collections|shop|store|catalog|list|search|deals|sale|browse|departments)\b/i;

const JSONLD_PRODUCT_TYPES = new Set(["Product", "ProductGroup"]);

function collectTypes(value: unknown, types: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTypes(item, types);
    }
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") {
    types.push(type);
  } else if (Array.isArray(type)) {
    for (const entry of type) {
      if (typeof entry === "string") {
        types.push(entry);
      }
    }
  }
  for (const nested of Object.values(record)) {
    collectTypes(nested, types);
  }
}

function hasProductJsonLd(jsonLd: unknown[]): boolean {
  const types: string[] = [];
  collectTypes(jsonLd, types);
  return types.some((type) => JSONLD_PRODUCT_TYPES.has(type));
}

function hasOfferJsonLd(jsonLd: unknown[]): boolean {
  const types: string[] = [];
  collectTypes(jsonLd, types);
  return types.some((type) => type === "Offer" || type === "AggregateOffer");
}

export function classifyPage(input: DetectionInput): DetectionResult {
  const reasons: string[] = [];

  if (input.blocked) {
    return {
      classification: "error",
      isPdp: false,
      confidence: "high",
      reasons: ["blocked"],
      score: 0,
    };
  }

  if (input.statusCode !== undefined && input.statusCode >= 400) {
    return {
      classification: "error",
      isPdp: false,
      confidence: "high",
      reasons: [`http_${input.statusCode}`],
      score: 0,
    };
  }

  const pathname = new URL(input.url).pathname;
  const priceCount = input.signals.priceTexts.length;
  const hasCta = input.signals.ctaTexts.length > 0;
  const productJsonLd = hasProductJsonLd(input.jsonLd);
  const offerJsonLd = hasOfferJsonLd(input.jsonLd);
  const productPath = PRODUCT_PATH.test(pathname);

  let score = 0;
  if (productJsonLd) {
    score += 3;
    reasons.push("jsonld_product");
  }
  if (offerJsonLd) {
    score += 2;
    reasons.push("jsonld_offer");
  }
  if (hasCta) {
    score += 2;
    reasons.push("cta");
  }
  if (priceCount >= 1 && priceCount <= 2) {
    score += 1;
    reasons.push("single_price");
  }
  if (productPath) {
    score += 1;
    reasons.push("product_path");
  }
  if (input.title) {
    score += 1;
    reasons.push("has_title");
  }
  if (priceCount > 3) {
    score -= 2;
    reasons.push("many_prices");
  }

  if (
    productJsonLd ||
    score >= 3 ||
    (score === 2 && priceCount >= 1 && priceCount <= 2)
  ) {
    return {
      classification: "product",
      isPdp: true,
      confidence: productJsonLd ? "high" : score >= 3 ? "medium" : "low",
      reasons,
      score,
    };
  }

  const isRoot = pathname === "/" || pathname === "";
  if (isRoot) {
    return {
      classification: "homepage",
      isPdp: false,
      confidence: "high",
      reasons: [...reasons, "root_path"],
      score,
    };
  }

  if (CATEGORY_PATH.test(pathname) || priceCount > 3) {
    return {
      classification: "category",
      isPdp: false,
      confidence: priceCount > 3 ? "medium" : "low",
      reasons: [...reasons, priceCount > 3 ? "many_prices" : "category_path"],
      score,
    };
  }

  return {
    classification: "unknown",
    isPdp: false,
    confidence: "low",
    reasons,
    score,
  };
}
