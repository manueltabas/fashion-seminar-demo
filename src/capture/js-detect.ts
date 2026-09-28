const CATEGORY_TERMS = [
  "price",
  "shipping",
  "delivery",
  "returns",
  "return policy",
  "warranty",
  "tax",
  "duties",
];

/**
 * Heuristic: the page has key content only inside JavaScript (scripts/CMS
 * payloads) that is not in the extracted text, so a crawler without JS may
 * miss it. True when several content categories appear in <script> blocks but
 * not in the normalized content.
 */
export function detectJsRendered(input: {
  html: string;
  content: string;
}): boolean {
  const scripts = (input.html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) ?? [])
    .join(" ")
    .toLowerCase();
  const content = input.content.toLowerCase();

  let mismatches = 0;
  for (const term of CATEGORY_TERMS) {
    if (scripts.includes(term) && !content.includes(term)) {
      mismatches += 1;
    }
  }

  return mismatches >= 2;
}
