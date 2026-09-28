import type { Dimension } from "../checks/types";

export type RecommendationTemplate = {
  action: string;
  why: string;
  dimension: Dimension;
};

export const RECOMMENDATION_CATALOG: Record<string, RecommendationTemplate> = {
  "D1.jsonld_product": {
    action: "Add structured product details for AI",
    why: "AI agents can't read the product without them.",
    dimension: "d1",
  },
  "D1.offer_price": {
    action: "Include the price in the product data",
    why: "Agents need the price to compare and recommend.",
    dimension: "d1",
  },
  "D1.price_currency": {
    action: "Include the currency with the price",
    why: "Agents can't interpret a price without its currency.",
    dimension: "d1",
  },
  "D1.availability": {
    action: "Include the stock status in the product data",
    why: "Agents need stock to recommend a product.",
    dimension: "d1",
  },
  "D1.price_valid_until": {
    action: "Say how long the price is valid",
    why: "So agents don't use an out-of-date price.",
    dimension: "d1",
  },
  "D1.product_identifier": {
    action: "Add a unique product identifier (SKU or barcode)",
    why: "Identifiers help agents match the exact product.",
    dimension: "d1",
  },
  "D1.variant_identifiers": {
    action: "Add an identifier to every variant",
    why: "Agents must be able to select the exact variant.",
    dimension: "d1",
  },
  "D1.brand": {
    action: "Include the brand name",
    why: "Agents attribute the product to a brand.",
    dimension: "d1",
  },
  "D1.reviews": {
    action: "Add ratings and reviews",
    why: "Social proof informs agent recommendations.",
    dimension: "d1",
  },
  "D1.image_description": {
    action: "Include an image and a description",
    why: "Agents use them to describe the product.",
    dimension: "d1",
  },
  "D1.shipping_details": {
    action: "Include delivery details in the product data",
    why: "Agents need delivery cost and time.",
    dimension: "d1",
  },
  "D1.merchant_return_policy": {
    action: "Include the return policy in the product data",
    why: "Agents need return terms to reassure buyers.",
    dimension: "d1",
  },
  "D1.structured_data_matches_content": {
    action: "Make the product data match the page",
    why: "Mismatches make agents state the wrong facts.",
    dimension: "d1",
  },
  "D1.physical_attributes": {
    action: "Add physical details (size, weight, materials)",
    why: "Agents use them to judge fit and suitability.",
    dimension: "d1",
  },
  "D1.category_attributes": {
    action: "Add the details buyers expect for this category",
    why: "Missing details block comparisons.",
    dimension: "d1",
  },
  "D2.main_content_in_html": {
    action: "Serve the product content without JavaScript",
    why: "If content needs JavaScript, crawlers see nothing.",
    dimension: "d2",
  },
  "D2.content_not_hidden_js": {
    action: "Show key content without tabs or accordions",
    why: "Hidden content is invisible to crawlers.",
    dimension: "d2",
  },
  "D2.heading_hierarchy": {
    action: "Use one clear page title and headings",
    why: "Headings help parsers structure the page.",
    dimension: "d2",
  },
  "D2.attributes_text": {
    action: "List the specs as text",
    why: "Text is the easiest format for AI to read.",
    dimension: "d2",
  },
  "D2.specs_parseable": {
    action: "Put the specs in a table or list",
    why: "Tables and lists parse reliably.",
    dimension: "d2",
  },
  "D2.description_substantive": {
    action: "Write a fuller product description",
    why: "Thin descriptions reduce understanding.",
    dimension: "d2",
  },
  "D2.locale_coherent": {
    action: "Set the page language",
    why: "Language signals affect interpretation.",
    dimension: "d2",
  },
  "D2.text_clean": {
    action: "Remove duplicate and filler text",
    why: "Noise dilutes the product information.",
    dimension: "d2",
  },
  "D2.critical_facts_not_only_images": {
    action: "Move key facts out of images into text",
    why: "AI can't read text baked into images.",
    dimension: "d2",
  },
  "D2.no_critical_info_only_pdfs": {
    action: "Move key facts out of PDFs into the page",
    why: "AI can't reliably read linked PDFs.",
    dimension: "d2",
  },
  "D2.specs_complete": {
    action: "Complete the specifications for this category",
    why: "Missing specs block confident recommendations.",
    dimension: "d2",
  },
  "D3.shipping_info": {
    action: "Show shipping cost and timing on the page",
    why: "Agents must quote shipping before a purchase.",
    dimension: "d3",
  },
  "D3.delivery_times": {
    action: "Give a delivery estimate",
    why: "Delivery time affects the decision.",
    dimension: "d3",
  },
  "D3.returns_policy": {
    action: "Publish a returns policy on the page",
    why: "Return terms build trust and reduce risk.",
    dimension: "d3",
  },
  "D3.return_window": {
    action: "State the return window in days",
    why: "A clear window is actionable.",
    dimension: "d3",
  },
  "D3.warranty": {
    action: "Add warranty or guarantee details",
    why: "A warranty reduces buyer risk.",
    dimension: "d3",
  },
  "D3.reviews": {
    action: "Show reviews and ratings",
    why: "Social proof informs recommendations.",
    dimension: "d3",
  },
  "D3.review_verification": {
    action: "Verify reviews or show a rating breakdown",
    why: "Verified reviews are more trustworthy.",
    dimension: "d3",
  },
  "D3.contact": {
    action: "Add contact details",
    why: "Buyers and agents need a way to reach you.",
    dimension: "d3",
  },
  "D3.legal_identity": {
    action: "Add your company details",
    why: "Company details build trust.",
    dimension: "d3",
  },
  "D3.privacy_policy": {
    action: "Link your privacy policy",
    why: "Buyers expect a privacy policy.",
    dimension: "d3",
  },
  "D3.tax_duties": {
    action: "Clarify taxes and duties",
    why: "The final price depends on them.",
    dimension: "d3",
  },
  "D3.policy_clear_actionable": {
    action: "Make policies specific and actionable",
    why: "Vague policies can't be applied.",
    dimension: "d3",
  },
  "D4.price_displayed": {
    action: "Show the price as text on the page",
    why: "Agents can't read a price that isn't text.",
    dimension: "d4",
  },
  "D4.price_not_login": {
    action: "Don't hide the price behind a login",
    why: "A login wall blocks agents entirely.",
    dimension: "d4",
  },
  "D4.stock_signal": {
    action: "Show a clear stock status",
    why: "Agents need stock to recommend.",
    dimension: "d4",
  },
  "D4.variant_stock": {
    action: "Show stock for each variant",
    why: "Agents must pick an available variant.",
    dimension: "d4",
  },
  "D4.currency_locale": {
    action: "Show the currency with the price",
    why: "Currency is needed to interpret the price.",
    dimension: "d4",
  },
  "D4.add_to_cart": {
    action: "Add a clear buy action",
    why: "Crawlers need a clear purchase path.",
    dimension: "d4",
  },
  "D4.payment_methods": {
    action: "Show accepted payment methods",
    why: "Payment options affect purchase confidence.",
    dimension: "d4",
  },
  "D4.robots_allows_agents": {
    action: "Allow AI crawlers in robots.txt",
    why: "Blocked crawlers can't reach the store.",
    dimension: "d4",
  },
  "D4.fetch_not_blocked": {
    action: "Stop blocking automated visits",
    why: "A blocked visit prevents any evaluation.",
    dimension: "d4",
  },
  "D4.no_agent_friction": {
    action: "Remove pop-ups and forced logins",
    why: "They block the buying flow.",
    dimension: "d4",
  },
  "D4.checkout_path_agent": {
    action: "Make the checkout steps clear",
    why: "Unclear steps stop an agent mid-purchase.",
    dimension: "d4",
  },
  "D4.landed_cost_clear": {
    action: "Show the total cost before checkout",
    why: "The full cost must be known before buying.",
    dimension: "d4",
  },
};
