/** Plain-language titles and evidence for checks shown to customers. */

export const CHECK_TITLES: Record<string, string> = {
  // D1
  "D1.jsonld_product": "Product details for AI",
  "D1.offer_price": "Price in the product data",
  "D1.price_currency": "Currency of the price",
  "D1.availability": "Stock status in the product data",
  "D1.price_valid_until": "Price validity date",
  "D1.product_identifier": "Product identifier (GTIN/SKU)",
  "D1.variant_identifiers": "Identifiers for each variant",
  "D1.brand": "Brand name",
  "D1.reviews": "Ratings and reviews data",
  "D1.image_description": "Image and description",
  "D1.shipping_details": "Delivery details in the product data",
  "D1.merchant_return_policy": "Return policy in the product data",
  "D1.structured_data_matches_content": "Product data matches the page",
  "D1.physical_attributes": "Physical details (size, weight, materials)",
  "D1.category_attributes": "Details buyers expect for this category",
  // D2
  "D2.main_content_in_html": "Content available without JavaScript",
  "D2.content_not_hidden_js": "Important content not hidden behind tabs",
  "D2.heading_hierarchy": "Clear headings",
  "D2.attributes_text": "Specs available as text",
  "D2.specs_parseable": "Specs in a readable table or list",
  "D2.description_substantive": "A useful product description",
  "D2.locale_coherent": "Page language",
  "D2.text_clean": "Clean, non-repetitive text",
  "D2.critical_facts_not_only_images": "Key facts not only in images",
  "D2.no_critical_info_only_pdfs": "Key facts not only in PDFs",
  "D2.specs_complete": "Complete specifications",
  // D3
  "D3.shipping_info": "Shipping on the page",
  "D3.delivery_times": "Delivery estimates on the page",
  "D3.returns_policy": "Returns policy on the page",
  "D3.return_window": "Return window on the page",
  "D3.warranty": "Warranty or guarantee on the page",
  "D3.reviews": "Reviews and ratings on the page",
  "D3.review_verification": "Verified reviews on the page",
  "D3.contact": "Contact details on the page",
  "D3.legal_identity": "Company details on the page",
  "D3.privacy_policy": "Privacy policy on the page",
  "D3.tax_duties": "Taxes and duties on the page",
  "D3.policy_clear_actionable": "Clear, actionable policies on the page",
  // D4
  "D4.price_displayed": "Price visible on the page",
  "D4.price_not_login": "Price not behind a login",
  "D4.stock_signal": "Stock status",
  "D4.variant_stock": "Stock for each variant",
  "D4.currency_locale": "Currency and locale",
  "D4.add_to_cart": "Clear way to buy",
  "D4.payment_methods": "Payment methods",
  "D4.robots_allows_agents": "Allows AI crawlers",
  "D4.fetch_not_blocked": "Page is reachable by AI",
  "D4.no_agent_friction": "No pop-ups or forced login",
  "D4.checkout_path_agent": "Clear checkout path",
  "D4.landed_cost_clear": "Total cost clear before checkout",
};

export function checkTitle(checkId: string): string {
  return CHECK_TITLES[checkId] ?? "Check";
}

export function describeCheckType(type: string): string {
  return type === "model" ? "AI review" : "Automatic check";
}

const EXACT_EVIDENCE: Record<string, string> = {
  "No JSON-LD Product or ProductGroup node found":
    "The page has no structured product details for AI to read.",
  "No JSON-LD Offer node found":
    "The product data does not include a price or offer.",
  "Offer present but no price field":
    "An offer is present but it does not include a price.",
  "No Offer with price to read a currency from":
    "There is no price to read a currency from.",
  "Offer.price present but priceCurrency missing":
    "A price is present but the currency is missing.",
  "No Offer.availability found":
    "The product data does not include a stock status.",
  "No Offer.priceValidUntil found":
    "The product data does not say how long the price is valid.",
  "No Product gtin/mpn/sku identifier found":
    "The product data has no product identifier (like GTIN or SKU).",
  "No variant has a gtin/sku identifier":
    "None of the product variants have an identifier.",
  "No brand in the JSON-LD product data":
    "The product data does not include a brand.",
  "No aggregateRating or review data":
    "There is no rating or review information.",
  "JSON-LD product has no image or description":
    "The product data includes neither an image nor a description.",
  "No Offer.shippingDetails":
    "Delivery details are not included in the product data.",
  "No Offer.hasMerchantReturnPolicy":
    "The return policy is not included in the product data.",
};

export function humanizeEvidence(evidence: string): string {
  const trimmed = evidence.trim();
  if (EXACT_EVIDENCE[trimmed]) {
    return EXACT_EVIDENCE[trimmed];
  }

  let match = /^JSON-LD @type=(\w+) name=(.*)$/.exec(trimmed);
  if (match) {
    return `Product details found for "${match[2]}".`;
  }
  match = /^JSON-LD Offer\.price=(.*)$/.exec(trimmed);
  if (match) {
    return `Price found in the product data: ${match[1]}.`;
  }
  match = /^JSON-LD Offer\.priceCurrency=(.*)$/.exec(trimmed);
  if (match) {
    return `Currency found: ${match[1]}.`;
  }
  match = /^JSON-LD Offer\.availability=(.*)$/.exec(trimmed);
  if (match) {
    return `Stock status found: ${match[1].split("/").pop()}.`;
  }
  match = /^JSON-LD Offer\.priceValidUntil=(.*)$/.exec(trimmed);
  if (match) {
    return `Price valid until ${match[1]}.`;
  }
  match = /^Unrecognized Offer\.availability value: (.*)$/.exec(trimmed);
  if (match) {
    return `Unrecognized stock status: ${match[1]}.`;
  }
  if (trimmed === "JSON-LD product has a brand") {
    return "Brand is included in the product data.";
  }
  if (trimmed === "JSON-LD Offer.hasMerchantReturnPolicy present") {
    return "Return policy is included in the product data.";
  }
  if (trimmed === "JSON-LD Offer.shippingDetails present") {
    return "Delivery details are included in the product data.";
  }

  // Fallback: de-jargon common field names.
  return trimmed
    .replace(/JSON-LD/gi, "product data")
    .replace(/Offer\.hasMerchantReturnPolicy/g, "return policy")
    .replace(/Offer\.shippingDetails/g, "delivery details")
    .replace(/Offer\.priceValidUntil/g, "price validity date")
    .replace(/Offer\.priceCurrency/g, "currency")
    .replace(/Offer\.availability/g, "stock status")
    .replace(/Offer\.price/g, "price")
    .replace(/Offer\./g, "");
}
