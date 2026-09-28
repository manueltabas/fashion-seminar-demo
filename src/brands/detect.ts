export function normalizeHost(url: string): string {
  const { hostname } = new URL(url);
  return hostname.toLowerCase().replace(/^www\d*\./, "");
}

export function registrableDomain(host: string): string {
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return host;
  }
  return parts.slice(-2).join(".");
}

export function brandNameFromDomain(domain: string): string {
  const label = domain.split(".")[0] ?? domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function brandFromStructuredData(structuredData: unknown): string | undefined {
  if (typeof structuredData !== "object" || structuredData === null) {
    return undefined;
  }
  const brand = (structuredData as { brand?: unknown }).brand;
  if (typeof brand === "string" && brand.trim() !== "") {
    return brand.trim();
  }
  if (typeof brand === "object" && brand !== null) {
    const name = (brand as { name?: unknown }).name;
    if (typeof name === "string" && name.trim() !== "") {
      return name.trim();
    }
  }
  return undefined;
}

export type BrandDetectionInput = {
  url: string;
  brandName?: string;
  structuredData?: unknown;
};

export type DetectedBrand = {
  host: string;
  domain: string;
  name: string;
  source: "explicit" | "structured_data" | "domain";
};

export function detectBrand(input: BrandDetectionInput): DetectedBrand {
  const host = normalizeHost(input.url);
  const domain = registrableDomain(host);

  if (input.brandName && input.brandName.trim() !== "") {
    return { host, domain, name: input.brandName.trim(), source: "explicit" };
  }

  const fromStructured = brandFromStructuredData(input.structuredData);
  if (fromStructured) {
    return { host, domain, name: fromStructured, source: "structured_data" };
  }

  return { host, domain, name: brandNameFromDomain(domain), source: "domain" };
}
