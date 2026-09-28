import * as cheerio from "cheerio";
import { normalizeHtml, type PdpSignals } from "../capture/normalize";
import { collectNodes, hasType } from "./jsonld";
import type { CheckContext, CheckOutcome, Finding } from "./types";

const EMPTY_SIGNALS: PdpSignals = {
  priceTexts: [],
  availabilityTexts: [],
  ctaTexts: [],
};

const CURRENCY = /[$€£]|\b(sek|usd|eur|gbp|nok|dkk|chf|kr)\b/i;
const ADD_TO_CART = /add to (cart|bag|basket)|buy now|checkout/i;
const WEAK_CTA = /notify me|select a size|select size|choose a size|coming soon/i;
const PAYMENT =
  /\b(visa|mastercard|amex|american express|paypal|klarna|apple pay|google pay|stripe|shop pay|afterpay|discover)\b/i;
const LOGIN_REQUIRED =
  /sign in to (continue|view|see)|log ?in to (continue|view|see)|login to (continue|view|see)|must be logged in|members only price/i;
const FRICTION_MARKERS =
  /\b(age gate|age verification|newsletter popup|newsletter-popup|interstitial|cookie wall|cookie-wall|modal|popup)\b/i;

function firstMatch(text: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(text);
  return match ? match[0] : undefined;
}

export function runD4Outcomes(context: CheckContext): CheckOutcome[] {
  const html = context.html ?? "";
  const $ = cheerio.load(html || "<html></html>");
  const $visible = cheerio.load(html || "<html></html>");
  $visible("script,style,noscript,template").remove();

  const normalized =
    context.normalized ??
    (html
      ? normalizeHtml(html)
      : { title: undefined, content: "", jsonLd: [], signals: EMPTY_SIGNALS });

  const signals = normalized.signals;
  const content = normalized.content;
  const lowerHtml = html.toLowerCase();

  const classIdText = $("[class],[id]")
    .map((_index, element) => `${$(element).attr("class") ?? ""} ${$(element).attr("id") ?? ""}`)
    .get()
    .join(" ")
    .toLowerCase();

  const outcomes: CheckOutcome[] = [];

  const nodes: Record<string, unknown>[] = [];
  collectNodes(context.jsonLd, nodes);
  const jsonAvailability = nodes.some(
    (node) =>
      hasType(node, "Offer") &&
      typeof node.availability === "string" &&
      node.availability.trim() !== "",
  );
  const jsonPriceOffer = nodes.find(
    (node) =>
      hasType(node, "Offer") &&
      typeof node.price === "string" &&
      node.price.trim() !== "",
  );
  const jsonCurrencyOffer = nodes.find(
    (node) =>
      hasType(node, "Offer") &&
      typeof node.priceCurrency === "string" &&
      node.priceCurrency.trim() !== "",
  );

  outcomes.push(
    signals.priceTexts.length > 0
      ? {
          status: "pass",
          evidence: `Price displayed as text: ${signals.priceTexts[0]}`,
        }
      : jsonPriceOffer
        ? {
            status: "pass",
            evidence: `Price is in the structured data (${String(
              jsonPriceOffer.price,
            )}); the page shows it with JavaScript.`,
          }
        : {
            status: "fail",
            evidence: "No price found on the page or in the product data",
          },
  );

  outcomes.push(
    LOGIN_REQUIRED.test(content)
      ? {
          status: "fail",
          evidence: `Price appears gated behind login: ${firstMatch(content, LOGIN_REQUIRED)}`,
        }
      : { status: "pass", evidence: "No login gate blocking the price" },
  );

  outcomes.push(
    signals.availabilityTexts.length > 0
      ? {
          status: "pass",
          evidence: `Availability shown: ${signals.availabilityTexts[0]}`,
        }
      : jsonAvailability
        ? { status: "pass", evidence: "Availability present in JSON-LD Offer" }
        : { status: "fail", evidence: "No stock/availability signal" },
  );

  const hasVariantSelect = $("select").length > 0;
  const variantMarkers = /\b(size|color|colour|variant|swatch)\b/.test(classIdText);
  const hasVariantUi = hasVariantSelect || variantMarkers;
  outcomes.push(
    hasVariantUi && signals.availabilityTexts.length > 0
      ? { status: "pass", evidence: "Variant selector with availability signal" }
      : hasVariantUi
        ? { status: "partial", evidence: "Variant selector present but no per-variant stock" }
        : { status: "fail", evidence: "No variant selection with per-variant stock" },
  );

  const currencyPrice = signals.priceTexts.find((text) => CURRENCY.test(text));
  outcomes.push(
    currencyPrice
      ? { status: "pass", evidence: `Currency is clear: ${currencyPrice}` }
      : jsonCurrencyOffer
        ? {
            status: "pass",
            evidence: `Currency in the structured data: ${String(
              jsonCurrencyOffer.priceCurrency,
            )}`,
          }
        : signals.priceTexts.length > 0
          ? { status: "partial", evidence: "Price present but no currency marker" }
          : { status: "fail", evidence: "No price/currency to read" },
  );

  const strongCta = signals.ctaTexts.find((text) => ADD_TO_CART.test(text));
  const weakCta = signals.ctaTexts.find((text) => WEAK_CTA.test(text));
  const jsonOfferForCta = nodes.find((node) => hasType(node, "Offer"));
  outcomes.push(
    strongCta
      ? { status: "pass", evidence: `Add-to-cart CTA present: ${strongCta}` }
      : weakCta
        ? { status: "partial", evidence: `Weak CTA only: ${weakCta}` }
        : signals.ctaTexts.length > 0
          ? {
              status: "partial",
              evidence: `Non-purchase CTA only: ${signals.ctaTexts[0]}`,
            }
          : jsonOfferForCta
            ? {
                status: "pass",
                evidence:
                  "No buy button in the raw HTML (the page adds it with JavaScript); the offer is available in the product data.",
              }
            : {
                status: "fail",
                evidence: "No add-to-cart / checkout entry on the page or in the product data",
              },
  );

  outcomes.push(
    PAYMENT.test(content) || PAYMENT.test(lowerHtml)
      ? { status: "pass", evidence: "Payment methods visible" }
      : { status: "fail", evidence: "No payment methods visible" },
  );

  if (!context.robots) {
    outcomes.push({
      status: "partial",
      evidence: "robots.txt has not been checked for this PDP",
    });
  } else if (!context.robots.present) {
    outcomes.push({
      status: "pass",
      evidence: "No robots.txt restrictions found",
    });
  } else {
    outcomes.push(
      context.robots.allowed
        ? { status: "pass", evidence: "robots.txt allows AI/agent crawlers" }
        : {
            status: "fail",
            evidence: `robots.txt blocks AI crawlers: ${context.robots.blockedBots.join(", ")}`,
          },
    );
  }

  if (context.fetch?.blocked) {
    outcomes.push({
      status: "fail",
      evidence: `Fetch was bot-blocked (HTTP ${context.fetch.statusCode ?? "?"})`,
    });
  } else if (context.fetch?.statusCode !== undefined && context.fetch.statusCode >= 400) {
    outcomes.push({
      status: "fail",
      evidence: `Fetch failed with HTTP ${context.fetch.statusCode}`,
    });
  } else {
    outcomes.push({ status: "pass", evidence: "Fetch was not bot-blocked" });
  }

  if (LOGIN_REQUIRED.test(content)) {
    outcomes.push({
      status: "fail",
      evidence: `Forced login: ${firstMatch(content, LOGIN_REQUIRED)}`,
    });
  } else {
    const frictionCount = (content.match(new RegExp(FRICTION_MARKERS, "gi")) ?? [])
      .length;
    const classIdFriction = FRICTION_MARKERS.test(classIdText) ? 1 : 0;
    const total = frictionCount + classIdFriction;
    outcomes.push(
      total === 0
        ? { status: "pass", evidence: "No interstitials, forced login, or modal walls" }
        : total <= 2
          ? {
              status: "partial",
              evidence: `${total} friction marker(s) found (modal/popup/interstitial)`,
            }
          : {
              status: "fail",
              evidence: `${total} friction markers found`,
            },
    );
  }

  return outcomes;
}

export const D4_CHECK_META: Array<{ id: string; weight: number }> = [
  { id: "D4.price_displayed", weight: 3 },
  { id: "D4.price_not_login", weight: 2 },
  { id: "D4.stock_signal", weight: 2 },
  { id: "D4.variant_stock", weight: 1 },
  { id: "D4.currency_locale", weight: 2 },
  { id: "D4.add_to_cart", weight: 2 },
  { id: "D4.payment_methods", weight: 1 },
  { id: "D4.robots_allows_agents", weight: 2 },
  { id: "D4.fetch_not_blocked", weight: 3 },
  { id: "D4.no_agent_friction", weight: 2 },
];

export function runD4Findings(context: CheckContext): Finding[] {
  const outcomes = runD4Outcomes(context);
  return D4_CHECK_META.map((meta, index) => ({
    checkId: meta.id,
    dimension: "d4" as const,
    type: "deterministic" as const,
    status: outcomes[index].status,
    weight: meta.weight,
    evidence: outcomes[index].evidence,
    details: outcomes[index].details,
  }));
}
