import type { CheckContext, CheckOutcome, Finding } from "./types";
import { collectNodes, hasAnyType, hasType, isRecord } from "./jsonld";

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim() !== "" : value !== undefined && value !== null;
}

const AVAILABILITY_TOKENS =
  /InStock|OutOfStock|PreOrder|BackOrder|InStoreOnly|LimitedAvailability|OnlineOnly|SoldOut|Discontinued/;

const IDENTIFIER_KEYS = ["gtin", "gtin8", "gtin12", "gtin13", "gtin14", "mpn", "sku"];

export function runD1Checks(context: CheckContext): CheckOutcome[] {
  const nodes: Record<string, unknown>[] = [];
  collectNodes(context.jsonLd, nodes);

  const products = nodes.filter((node) => hasType(node, "Product"));
  const productGroups = nodes.filter((node) => hasType(node, "ProductGroup"));
  const primary = products[0] ?? productGroups[0];
  const offers = nodes.filter((node) => hasAnyType(node, ["Offer", "AggregateOffer"]));
  const offersWithPrice = offers.filter((offer) => nonEmpty(offer.price));
  const ratings = nodes.filter((node) =>
    hasAnyType(node, ["AggregateRating", "Review"]),
  );

  const outcomes: CheckOutcome[] = [];

  outcomes.push(
    primary
      ? {
          status: "pass",
          evidence: `JSON-LD @type=${hasType(primary, "Product") ? "Product" : "ProductGroup"} name=${String(
            primary.name ?? "(none)",
          )}`,
        }
      : { status: "fail", evidence: "No JSON-LD Product or ProductGroup node found" },
  );

  outcomes.push(
    offersWithPrice.length > 0
      ? {
          status: "pass",
          evidence: `JSON-LD Offer.price=${String(offersWithPrice[0].price)}`,
        }
      : offers.length > 0
        ? { status: "partial", evidence: "Offer present but no price field" }
        : { status: "fail", evidence: "No JSON-LD Offer node found" },
  );

  const currencyOffer = offersWithPrice.find((offer) => nonEmpty(offer.priceCurrency));
  outcomes.push(
    currencyOffer
      ? {
          status: "pass",
          evidence: `JSON-LD Offer.priceCurrency=${String(currencyOffer.priceCurrency)}`,
        }
      : offersWithPrice.length > 0
        ? { status: "partial", evidence: "Offer.price present but priceCurrency missing" }
        : { status: "fail", evidence: "No Offer with price to read a currency from" },
  );

  const availabilityOffer = offers.find((offer) => nonEmpty(offer.availability));
  if (availabilityOffer) {
    const availability = String(availabilityOffer.availability);
    outcomes.push(
      AVAILABILITY_TOKENS.test(availability)
        ? { status: "pass", evidence: `JSON-LD Offer.availability=${availability}` }
        : {
            status: "partial",
            evidence: `Unrecognized Offer.availability value: ${availability}`,
          },
    );
  } else {
    outcomes.push({
      status: "fail",
      evidence: "No Offer.availability found",
    });
  }

  const validUntil = offers.find((offer) => nonEmpty(offer.priceValidUntil));
  outcomes.push(
    validUntil
      ? {
          status: "pass",
          evidence: `JSON-LD Offer.priceValidUntil=${String(validUntil.priceValidUntil)}`,
        }
      : { status: "fail", evidence: "No Offer.priceValidUntil found" },
  );

  const identifierNode = products.find((node) =>
    IDENTIFIER_KEYS.some((key) => nonEmpty(node[key])),
  );
  outcomes.push(
    identifierNode
      ? { status: "pass", evidence: "JSON-LD Product has a gtin/mpn/sku identifier" }
      : { status: "fail", evidence: "No Product gtin/mpn/sku identifier found" },
  );

  const variantGroups = productGroups.filter(
    (group) => Array.isArray(group.hasVariant) && group.hasVariant.length > 0,
  );
  if (variantGroups.length === 0) {
    outcomes.push({
      status: "pass",
      evidence: "No product variants declared",
    });
  } else {
    const variants = variantGroups.flatMap((group) =>
      (group.hasVariant as unknown[]).filter(isRecord),
    );
    const withIdentifier = variants.filter((variant) =>
      IDENTIFIER_KEYS.some((key) => nonEmpty(variant[key])),
    );
    outcomes.push(
      withIdentifier.length === variants.length
        ? {
            status: "pass",
            evidence: `All ${variants.length} variants have a gtin/sku`,
          }
        : withIdentifier.length > 0
          ? {
              status: "partial",
              evidence: `${withIdentifier.length}/${variants.length} variants have a gtin/sku`,
            }
          : { status: "fail", evidence: "No variant has a gtin/sku identifier" },
    );
  }

  const brandNode = nodes.find(
    (node) => hasAnyType(node, ["Product", "ProductGroup"]) && nonEmpty(node.brand),
  );
  outcomes.push(
    brandNode
      ? { status: "pass", evidence: "JSON-LD product has a brand" }
      : { status: "fail", evidence: "No brand in the JSON-LD product data" },
  );

  outcomes.push(
    ratings.length > 0
      ? {
          status: "pass",
          evidence: `JSON-LD has ${ratings.length} rating/review node(s)`,
        }
      : { status: "fail", evidence: "No aggregateRating or review data" },
  );

  const image = primary ? nonEmpty(primary.image) : false;
  const description = primary ? nonEmpty(primary.description) : false;
  outcomes.push(
    image && description
      ? { status: "pass", evidence: "JSON-LD product has image and description" }
      : image || description
        ? {
            status: "partial",
            evidence: `JSON-LD product has ${image ? "image" : "description"} but not both`,
          }
        : { status: "fail", evidence: "JSON-LD product has no image or description" },
  );

  const shipping = offers.find((offer) => nonEmpty(offer.shippingDetails));
  outcomes.push(
    shipping
      ? { status: "pass", evidence: "JSON-LD Offer.shippingDetails present" }
      : { status: "fail", evidence: "No Offer.shippingDetails" },
  );

  const returnPolicy = offers.find((offer) =>
    nonEmpty(offer.hasMerchantReturnPolicy),
  );
  outcomes.push(
    returnPolicy
      ? {
          status: "pass",
          evidence: "JSON-LD Offer.hasMerchantReturnPolicy present",
        }
      : { status: "fail", evidence: "No Offer.hasMerchantReturnPolicy" },
  );

  return outcomes;
}

export const D1_CHECK_META: Array<{ id: string; weight: number }> = [
  { id: "D1.jsonld_product", weight: 3 },
  { id: "D1.offer_price", weight: 3 },
  { id: "D1.price_currency", weight: 2 },
  { id: "D1.availability", weight: 2 },
  { id: "D1.price_valid_until", weight: 1 },
  { id: "D1.product_identifier", weight: 2 },
  { id: "D1.variant_identifiers", weight: 2 },
  { id: "D1.brand", weight: 1 },
  { id: "D1.reviews", weight: 1 },
  { id: "D1.image_description", weight: 1 },
  { id: "D1.shipping_details", weight: 2 },
  { id: "D1.merchant_return_policy", weight: 2 },
];

export function runD1(context: CheckContext): Finding[] {
  const outcomes = runD1Checks(context);
  return D1_CHECK_META.map((meta, index) => ({
    checkId: meta.id,
    dimension: "d1" as const,
    type: "deterministic" as const,
    status: outcomes[index].status,
    weight: meta.weight,
    evidence: outcomes[index].evidence,
    details: outcomes[index].details,
  }));
}
