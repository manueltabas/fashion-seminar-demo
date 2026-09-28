import * as cheerio from "cheerio";
import { normalizeHtml, type PdpSignals } from "../capture/normalize";
import { collectNodes, hasAnyType } from "./jsonld";
import type { CheckContext, CheckOutcome, Finding } from "./types";

const EMPTY_SIGNALS: PdpSignals = {
  priceTexts: [],
  availabilityTexts: [],
  ctaTexts: [],
};

const SHIPPING = /shipping|delivery|deliver/i;
const SHIPPING_DETAIL = /free|cost|fee|[$€£]|\bkr\b|\d+\s*(?:business\s*)?days?/i;
const DELIVERY_TIME =
  /\b(?:delivery|deliver|shipping|dispatch|arrive)[^.]{0,40}\b\d+\s*(?:-|to)?\s*\d*\s*(?:business\s*)?days?\b|\b\d+\s*(?:-|to)?\s*\d*\s*business\s*days?\b|estimated delivery|delivery by|next[- ]day|same[- ]day/i;
const RETURNS = /\breturns?\b|\brefunds?\b|\bexchanges?\b/i;
const RETURN_WINDOW =
  /\d{1,3}[- ]?days?\b[^.]{0,40}\b(return|refund|exchange)s?\b|\b(return|refund|exchange)s?\b[^.]{0,40}\d{1,3}[- ]?days?\b/i;
const WARRANTY = /\bwarranty\b|\bguarantee\b|\bguaranteed\b/i;
const REVIEWS = /\breviews?\b|\bratings?\b|\d(?:\.\d)?\s*\/\s*5|\bstars?\b/i;
const REVIEW_VERIFICATION =
  /verified (purchase|buyer|review)|\d+\s*reviews?\b|rating distribution|review distribution/i;
const CONTACT =
  /\bcontacts?\b|\bemails?\b|\bphones?\b|\bcall us\b|\bcustomer (service|support)\b|\bhelp (center|centre)\b|\bsupport\b/i;
const STRONG_CONTACT =
  /\bcontact us\b|\be-?mail\b|\bphone\b|\bcall us\b|\bhelp (center|centre)\b|\bsupport@|\b[\w.+-]+@[\w-]+\.[\w.]+/i;
const LEGAL =
  /\b(inc|llc|ltd|gmbh|plc|ab)\b\.?|\bcompany (no|number|registration)\b|\bregistered (office|in)\b|\bvat (number|no|id)\b|\baddress\b|\bdba\b/i;
const PRIVACY = /privacy (policy|notice)/i;
const TAX = /\btaxes?\b|\bduties\b|\bvat\b|\bcustoms\b|\bimport (fees|charges|duties)\b/i;

function firstLine(lines: string[], pattern: RegExp): string | undefined {
  return lines.find((line) => pattern.test(line));
}

function describe(line: string | undefined, fallback: string): string {
  if (!line) {
    return fallback;
  }
  return line.length > 120 ? `${line.slice(0, 117)}...` : line;
}

function presentOrAbsent(
  line: string | undefined,
  fallback: string,
): CheckOutcome {
  return line
    ? { status: "pass", evidence: describe(line, fallback) }
    : { status: "fail", evidence: fallback };
}

export function runD3Outcomes(context: CheckContext): CheckOutcome[] {
  const html = context.html ?? "";
  const $ = cheerio.load(html || "<html></html>");
  const $visible = cheerio.load(html || "<html></html>");
  $visible("script,style,noscript,template").remove();

  const normalized =
    context.normalized ??
    (html
      ? normalizeHtml(html)
      : { title: undefined, content: "", jsonLd: [], signals: EMPTY_SIGNALS });

  const lines = normalized.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const hrefs = $("a[href]")
    .map((_index, element) => $(element).attr("href") ?? "")
    .get()
    .join(" ")
    .toLowerCase();

  const hasContactLink = /mailto:|tel:|\/contact|\/help|\/support/.test(hrefs);
  const hasPrivacyLink = /privacy/.test(hrefs);

  const nodes: Record<string, unknown>[] = [];
  collectNodes(context.jsonLd, nodes);
  const hasRatingData = nodes.some((node) =>
    hasAnyType(node, ["AggregateRating", "Review"]),
  );

  const outcomes: CheckOutcome[] = [];

  const shippingLine = firstLine(lines, SHIPPING);
  outcomes.push(
    shippingLine && SHIPPING_DETAIL.test(shippingLine)
      ? { status: "pass", evidence: describe(shippingLine, "") }
      : shippingLine
        ? {
            status: "partial",
            evidence: `${describe(shippingLine, "")} (no cost or timeline detail)`,
          }
        : { status: "fail", evidence: "No shipping or delivery information" },
  );

  outcomes.push(
    presentOrAbsent(
      firstLine(lines, DELIVERY_TIME),
      "No concrete delivery time estimate",
    ),
  );

  outcomes.push(
    presentOrAbsent(firstLine(lines, RETURNS), "No returns policy found"),
  );

  outcomes.push(
    presentOrAbsent(
      firstLine(lines, RETURN_WINDOW),
      "No explicit return window (number of days)",
    ),
  );

  outcomes.push(
    presentOrAbsent(firstLine(lines, WARRANTY), "No warranty or guarantee"),
  );

  outcomes.push(
    hasRatingData || firstLine(lines, REVIEWS)
      ? {
          status: "pass",
          evidence: hasRatingData
            ? "JSON-LD has rating/review data"
            : describe(firstLine(lines, REVIEWS), "Reviews mentioned"),
        }
      : { status: "fail", evidence: "No reviews or social proof" },
  );

  outcomes.push(
    presentOrAbsent(
      firstLine(lines, REVIEW_VERIFICATION),
      "No review verification or rating distribution",
    ),
  );

  const strongContactLine = firstLine(lines, STRONG_CONTACT);
  const weakContactLine = firstLine(lines, CONTACT);
  outcomes.push(
    strongContactLine
      ? { status: "pass", evidence: describe(strongContactLine, "") }
      : hasContactLink
        ? { status: "pass", evidence: "Contact link present" }
        : weakContactLine
          ? {
              status: "partial",
              evidence: `Mentioned but no contact details found: ${describe(weakContactLine, "")}`,
            }
          : { status: "fail", evidence: "No contact or company info" },
  );

  outcomes.push(
    presentOrAbsent(
      firstLine(lines, LEGAL),
      "No legal business identity (name/address/VAT)",
    ),
  );

  outcomes.push(
    firstLine(lines, PRIVACY) || hasPrivacyLink
      ? {
          status: "pass",
          evidence: describe(
            firstLine(lines, PRIVACY),
            "Privacy policy link present",
          ),
        }
      : { status: "fail", evidence: "No privacy policy" },
  );

  outcomes.push(
    presentOrAbsent(firstLine(lines, TAX), "No tax/duties information"),
  );

  return outcomes;
}

export const D3_CHECK_META: Array<{ id: string; weight: number }> = [
  { id: "D3.shipping_info", weight: 2 },
  { id: "D3.delivery_times", weight: 1 },
  { id: "D3.returns_policy", weight: 2 },
  { id: "D3.return_window", weight: 1 },
  { id: "D3.warranty", weight: 1 },
  { id: "D3.reviews", weight: 2 },
  { id: "D3.review_verification", weight: 1 },
  { id: "D3.contact", weight: 1 },
  { id: "D3.legal_identity", weight: 1 },
  { id: "D3.privacy_policy", weight: 1 },
  { id: "D3.tax_duties", weight: 1 },
];

export function runD3Findings(context: CheckContext): Finding[] {
  const outcomes = runD3Outcomes(context);
  return D3_CHECK_META.map((meta, index) => ({
    checkId: meta.id,
    dimension: "d3" as const,
    type: "deterministic" as const,
    status: outcomes[index].status,
    weight: meta.weight,
    evidence: outcomes[index].evidence,
    details: outcomes[index].details,
  }));
}
