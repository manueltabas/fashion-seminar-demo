# Manual Validation Run 02 — Revised Prompt

PDP: https://www.rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst (same as run-01)
Changes vs run-01:
- Sharpened pass/partial/fail criteria.
- Evidence rule: no breadcrumb/section-title evidence; concrete observation for absence checks.
- Removed text_clean and no_agent_hostile_friction (now deterministic; not asked).
- Capture fix: the primary CTA is included in the normalized content.

## How to run

1. New chat in ChatGPT, Claude and Gemini.
2. Paste everything inside BEGIN PASTE as one message.
3. Send back each raw JSON.

---

BEGIN PASTE

INSTRUCTIONS (evaluate strictly, return JSON only)

You are a strict, evidence-based evaluator of e-commerce Product Detail Pages
(PDPs) for AI/agent readiness.

You will receive the content of ONE PDP, extracted from its public HTML, plus
its structured data (JSON-LD) when present. Evaluate ONLY the checks listed
below.

GLOBAL RULES
- Use ONLY the provided content. Do not use outside knowledge about the brand
  or product.
- If the provided content contains no evidence for a check, the check is "fail".
- "partial" means the signal is present but incomplete, ambiguous, or only true
  for some variants.
- "pass" means the signal is fully present and unambiguous.
- "evidence" must be a short verbatim quote from the provided content, or a
  precise location such as "JSON-LD Offer.price". For checks about an absence
  (when no quote can prove it), write a concrete observation instead. Never use
  a breadcrumb, section title, or navigation text as evidence.
- Never output a numeric score. Do not add commentary outside the JSON.
- If the content is marked truncated, judge only what is present and lower
  confidence where relevant.
- Return JSON only, matching the schema exactly.

CHECKS (id — criteria)
D1.structured_data_matches_content — pass if the JSON-LD name, price, currency,
availability and brand are consistent with the visible content; fail if price,
currency, or availability contradict the visible content; partial for minor
inconsistencies (for example naming or formatting only).
D1.physical_attributes — pass only if measurable physical attributes are present
(dimensions, weight, capacity) or the material composition is complete; partial
if only qualitative descriptors (color, finish, feel) are present; fail if none.
D1.category_attributes — pass if the attributes a buyer needs for this product
category are present (e.g. size/color for apparel, capacity for electronics);
partial if incomplete; fail if absent.
D2.critical_facts_not_only_images — pass if price/availability/key specs are
available as text; fail if any critical fact exists only inside images.
D2.no_critical_info_only_pdfs — pass if critical information is present in the
page text, not only in a linked PDF; fail otherwise.
D2.specs_complete — pass only if the specifications required for the category
are complete (for footwear: materials, sizing/fit, care, and at least one
measurable spec such as weight or dimensions); partial if some are missing; fail
if absent.
D3.policy_clear_actionable — pass if shipping, returns, and warranty/guarantee
information is present and specific enough to act on; partial if vague or
incomplete; fail if missing.
D4.checkout_path_agent — pass if the primary call-to-action (for example
"Add to cart") and its requirements are present and clear; partial if only a
variant selector/availability is present or the CTA is absent from the content;
fail if no purchase path is described.
D4.landed_cost_clear — pass if shipping cost and any taxes/duties are clear
before checkout; partial if only partially indicated; fail if absent.
brand_perception — 1-2 lines describing what the brand appears to be and what it
is known for based ONLY on this page. Not scored.

OUTPUT SCHEMA (JSON only)
{
  "checks": [
    {
      "check_id": "D1.structured_data_matches_content",
      "status": "pass | partial | fail",
      "evidence": "short verbatim quote or precise location",
      "confidence": "high | medium | low"
    }
  ],
  "brand_perception": "1-2 lines"
}

Return exactly one entry per check_id listed above (9 checks).

DATA

PDP URL: https://www.rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst
Detected brand: Rothy's
Product title (if detectable): The Kids Clog
Content truncated: false

=== STRUCTURED DATA (JSON-LD) ===
{
  "@context": "http://schema.org/",
  "@type": "ProductGroup",
  "name": "The Kids Clog - ReVelvet\u2122 Butterscotch Burst",
  "description": "The Kids Clog in ReVelvet\u2122 Butterscotch Burst\n\n\nSoft, flexible rounded upper in warm brown with a star burst pattern.\nCrafted with ReVelvet\u2014soft and luxe with a suede-like finish.\nFeatures a comfortable, adjustable hook & loop heelstrap in warm brown to keep their little feet secure.\nComfortable, contoured footbed feels good on their soles.\nDurable rubber outsoles in tan with added traction.\n\n",
  "color": "Brown/",
  "url": "https://rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst",
  "brand": { "@type": "Brand", "name": "Rothy's" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "85" },
  "audience": { "@type": "PeopleAudience", "suggestedGender": "Unisex" },
  "productGroupID": "7714698100830",
  "material": "Recycled Plastic",
  "variesBy": ["https://schema.org/size", "https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "productID": "43055079620702",
      "sku": "395_002_RVBB_8",
      "mpn": "395_002_RVBB_8",
      "gtin": "192249527919",
      "image": "https://rothys.com/cdn/shop/files/395_KidsReVelvetClog_ReVelvetButterscotchBurst_PrimaryOverhead_6599.jpg",
      "name": "The Kids Clog - ReVelvet\u2122 Butterscotch Burst",
      "color": "ReVelvet\u2122 Butterscotch Burst",
      "size": "8",
      "offers": {
        "@type": "Offer",
        "url": "https://rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst?variant=43055079620702",
        "priceCurrency": "USD",
        "price": "65.0",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@type": "Product",
      "productID": "43055079653470",
      "sku": "395_002_RVBB_9",
      "mpn": "395_002_RVBB_9",
      "gtin": "192249527926",
      "image": "https://rothys.com/cdn/shop/files/395_KidsReVelvetClog_ReVelvetButterscotchBurst_PrimaryOverhead_6599.jpg",
      "name": "The Kids Clog - ReVelvet\u2122 Butterscotch Burst",
      "color": "ReVelvet\u2122 Butterscotch Burst",
      "size": "9",
      "offers": {
        "@type": "Offer",
        "url": "https://rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst?variant=43055079653470",
        "priceCurrency": "USD",
        "price": "65.0",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock"
      }
    }
  ]
}
(Remaining 8 variants follow the same shape for sizes 10, 11, 12, 13, 1, 2, 3, each with its own sku/mpn/gtin and the same USD 65.00 price and availability.)

=== NORMALIZED PAGE CONTENT (text/markdown) ===
Breadcrumb: Home / Kids Shoes / The Kids Clog

The Kids Clog

Regular price SEK 769kr
Sale price SEK 769kr
Unit price / per (includes duties & taxes)

Rating: 4.6941175 / 5 from 85 reviews

Color: ReVelvet™ Butterscotch Burst
Other colors available: Black, Desert Cat, Dove, Tutu, Indigo Daisy, Conch,
Deep Navy, Retro Wave, Pink Crochet, Sunny Crochet, White Crochet,
ReVelvet™ Fuchsia Burst

Size: 8, 9, 10, 11, 12, 13, 1, 2, 3
"Runs small. Size up for a better fit."

PRIMARY CALL TO ACTION
Button: "Select a size"
For the selected size: "Out Of Stock Online"
Secondary button: "Notify Me"
Note: "Coming Soon—Join the waitlist to be notified when your size is ready to order."

Shipping: "Free shipping on orders above kr 2,200."
Returns: "30 days to return." Link: Rothy's International returns.
"Prices are inclusive of VAT & duties. Discounts are calculated at checkout."

Description:
"Inspired by our best-selling Clog, The Kids Clog features a roomy toebox and an
adjustable hook & loop strap for the perfect fit. This style runs small; we
suggest ordering the next size up for a better fit."

Highlights:
- MACHINE WASHABLE: Toss in the wash with cold water. Air dry.
- PILLOW-LIKE COMFORT: soft, plush footbed.
- RECYCLED PLASTIC BOTTLES: "It took about 10 plastic bottles to knit these shoes."
- ROTHY'S REVELVET™: "soft, durable, and 100% knit from plastic bottles."

Details:
- Soft, flexible rounded upper in warm brown with a star burst pattern.
- Crafted with ReVelvet—soft and luxe with a suede-like finish.
- Features a comfortable, adjustable hook & loop heelstrap in warm brown.
- Comfortable, contoured footbed feels good on their soles.
- Durable rubber outsoles in tan with added traction.

SKU 395_002_RVBB

Washing Instructions:
- All of our styles are machine washable.
- Toss shoes in the wash with cold water.
- Air dry. No heat, please.

Sustainability:
- This style is made with Rothy's ReVelvet™, knit from 100% plastic bottles.
- It took about 10 plastic bottles to knit this pair of shoes.

Reviews:
Overall rating: 4.6941175 / 5 from 85 reviews.
Sample: "We love our rothys. I wish they made a womens red clog to match my littles!" — Taylor B. (5/5)
Sample: "Great shoe, well made." — Catherine I. (5/5)

Footer links: Contact Us, Help Center, FAQs, Returns, Shipping Information,
Washing Instructions, Fit Guide, Accessibility, Privacy Policy, Terms Of Use.

END PASTE
