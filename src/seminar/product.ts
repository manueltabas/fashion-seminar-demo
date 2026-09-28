import { collectNodes, hasType, isRecord } from "../checks/jsonld";

export type ProductCardData = { title: string; imageUrl: string | null; brand: string | null; price: string | null; availability: string | null; multipleOffers: boolean };
const string = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
export function safeWebUrl(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try { const u = new URL(value, base); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
function pageKey(value: unknown, base: string): string | null {
  const url = safeWebUrl(value, base);
  if (!url) return null;
  const u = new URL(url); return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
}
const stock: Record<string, string> = { InStock: "In stock", OutOfStock: "Out of stock", SoldOut: "Sold out", PreOrder: "Pre-order", PreSale: "Pre-sale", BackOrder: "Back order", LimitedAvailability: "Limited availability", OnlineOnly: "Online only", InStoreOnly: "In-store only", Discontinued: "Discontinued" };

export function extractProductCard(jsonLd: unknown[], url: string, fallbackTitle: string): ProductCardData {
  const empty: ProductCardData = { title: fallbackTitle, imageUrl: null, brand: null, price: null, availability: null, multipleOffers: false };
  const nodes: Record<string, unknown>[] = []; collectNodes(jsonLd, nodes);
  const byId = new Map(nodes.filter(n => typeof n["@id"] === "string").map(n => [n["@id"] as string, n]));
  const resolve = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value : [value]).filter(isRecord).map(v => typeof v["@id"] === "string" ? { ...byId.get(v["@id"]), ...v } : v);
  const products = nodes.filter(n => hasType(n, "Product") || hasType(n, "ProductGroup"));
  const matches = products.filter(p => pageKey(p.url, url) === pageKey(url, url));
  const groups = matches.filter(p => hasType(p, "ProductGroup"));
  const product = groups.length === 1 ? groups[0] : matches.length === 1 ? matches[0] : products.length === 1 && !safeWebUrl(products[0].url, url) ? products[0] : undefined;
  if (!product) return empty;
  const variants = hasType(product, "ProductGroup") ? resolve(product.hasVariant) : [];
  const offers = [product, ...variants].flatMap(p => resolve(p.offers));
  const prices = new Map<string, number[]>();
  for (const offer of offers) {
    const currency = string(offer.priceCurrency);
    if (!currency || !/^[A-Z]{3}$/.test(currency)) continue;
    const raw = offer.price ?? (hasType(offer, "AggregateOffer") ? offer.lowPrice : undefined);
    if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "") continue;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) continue;
    const values = prices.get(currency) ?? []; values.push(price);
    if (hasType(offer, "AggregateOffer") && offer.highPrice !== undefined) {
      const high = Number(offer.highPrice); if (Number.isFinite(high) && high >= price) values.push(high);
    }
    prices.set(currency, values);
  }
  const price = [...prices].map(([currency, values]) => {
    const low = Math.min(...values), high = Math.max(...values);
    return low === high ? `${currency} ${low.toFixed(2)}` : `${currency} ${low.toFixed(2)}–${high.toFixed(2)}`;
  }).join(" / ") || null;
  const availability = offers.map(o => {
    const value = string(o.availability)?.split(/[\/#]/).pop(); return value ? stock[value] ?? null : null;
  });
  const unique = [...new Set(availability)];
  const image = product.image ?? variants.find(v => v.image)?.image;
  const imageValue = Array.isArray(image) ? image[0] : image;
  const brand = isRecord(product.brand) ? string(product.brand.name) : string(product.brand);
  return {
    title: string(product.name) ?? fallbackTitle,
    brand,
    imageUrl: safeWebUrl(isRecord(imageValue) ? imageValue.url ?? imageValue.contentUrl : imageValue, url),
    price,
    availability: unique.length === 1 ? unique[0] : availability.length ? "Varies or is incomplete across offers" : null,
    multipleOffers: offers.length > 1 || offers.some(o => hasType(o, "AggregateOffer")),
  };
}

export function stockCaptureDisagreement(availability: string | null, content: string): string | null {
  if (availability === "In stock" && /out\s+of\s+stock|sold\s+out/i.test(content)) {
    return "Stock signals disagree: the product data says in stock, but the captured page also contains out-of-stock text. Confirm availability for the selected size on the retailer’s page.";
  }
  return null;
}
