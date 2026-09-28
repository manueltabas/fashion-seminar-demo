import * as cheerio from "cheerio";
import { normalizeHtml, type PdpSignals } from "../capture/normalize";
import type { CheckContext, CheckOutcome, Finding } from "./types";

const BOILERPLATE_PATTERNS = [
  /all rights reserved/i,
  /subscribe to our (newsletter|emails)/i,
  /sign up for our newsletter/i,
  /accept (all )?cookies/i,
  /this website uses cookies/i,
];

const EMPTY_SIGNALS: PdpSignals = {
  priceTexts: [],
  availabilityTexts: [],
  ctaTexts: [],
};

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function runD2Outcomes(context: CheckContext): CheckOutcome[] {
  const html = context.html ?? "";
  const $ = cheerio.load(html || "<html></html>");

  const $visible = cheerio.load(html || "<html></html>");
  $visible("script,style,noscript,template").remove();
  const visibleText = collapse($visible("body").text());

  const normalized =
    context.normalized ??
    (html
      ? normalizeHtml(html)
      : { title: undefined, content: "", jsonLd: [], signals: EMPTY_SIGNALS });

  const outcomes: CheckOutcome[] = [];

  const textLength = visibleText.length;
  outcomes.push(
    textLength >= 800
      ? { status: "pass", evidence: `Raw HTML has ${textLength} chars of visible text` }
      : textLength >= 250
        ? { status: "partial", evidence: `Only ${textLength} chars of visible text in raw HTML` }
        : { status: "fail", evidence: `Almost no visible text in raw HTML (${textLength} chars)` },
  );

  let hiddenWithText = 0;
  $(
    "[hidden],[style*='display:none'],[style*='display: none'],[style*='visibility:hidden'],[aria-hidden='true']",
  ).each((_index, element) => {
    if (collapse($(element).text()).length > 60) {
      hiddenWithText += 1;
    }
  });
  outcomes.push(
    hiddenWithText === 0
      ? { status: "pass", evidence: "No substantial content hidden behind JS-only elements" }
      : hiddenWithText <= 2
        ? {
            status: "partial",
            evidence: `${hiddenWithText} hidden element(s) contain substantial text`,
          }
        : {
            status: "fail",
            evidence: `${hiddenWithText} hidden elements contain substantial text (likely JS tabs)`,
          },
  );

  const h1Count = $("h1").length;
  const headingCount = $("h1,h2,h3,h4,h5,h6").length;
  outcomes.push(
    headingCount === 0
      ? { status: "fail", evidence: "No headings found" }
      : h1Count === 1
        ? {
            status: "pass",
            evidence: `Exactly one H1 and ${headingCount} heading(s) total`,
          }
        : {
            status: "partial",
            evidence: `H1 count is ${h1Count} (expected 1)`,
          },
  );

  const tableRows = $("table tr").length;
  const listItems = $("ul li, ol li").length;
  const dlItems = $("dt, dd").length;
  const attributeTotal = tableRows + listItems + dlItems;
  outcomes.push(
    attributeTotal >= 4
      ? {
          status: "pass",
          evidence: `Attributes present as text (${tableRows} table rows, ${listItems} list items)`,
        }
      : attributeTotal >= 1
        ? {
            status: "partial",
            evidence: `Only ${attributeTotal} attribute item(s) as table/list text`,
          }
        : { status: "fail", evidence: "No table/list/dl attribute text found" },
  );

  const hasTable = $("table").length > 0;
  const hasDl = $("dl").length > 0;
  const structuredItems = Math.max(tableRows, dlItems);
  outcomes.push(
    (hasTable || hasDl) && structuredItems >= 2
      ? {
          status: "pass",
          evidence: `Structured specs present (${hasTable ? "table" : "definition list"})`,
        }
      : hasTable || hasDl
        ? {
            status: "partial",
            evidence: "Table or definition list present but with few rows",
          }
        : { status: "fail", evidence: "No table or definition list for specs" },
  );

  let maxParagraph = 0;
  $("p").each((_index, element) => {
    maxParagraph = Math.max(maxParagraph, collapse($(element).text()).length);
  });
  const hasDescription =
    normalized.content.length >= 120 && maxParagraph >= 80;
  outcomes.push(
    hasDescription && maxParagraph >= 120
      ? { status: "pass", evidence: `Description paragraph up to ${maxParagraph} chars` }
      : maxParagraph >= 40
        ? { status: "partial", evidence: `Longest paragraph is only ${maxParagraph} chars` }
        : { status: "fail", evidence: "No substantive description paragraph" },
  );

  const lang = $("html").attr("lang")?.trim();
  outcomes.push(
    lang && /^[a-z]{2}(-[A-Za-z0-9]+)*$/i.test(lang)
      ? { status: "pass", evidence: `html lang="${lang}"` }
      : visibleText.length > 0
        ? { status: "partial", evidence: "No valid html lang attribute" }
        : { status: "fail", evidence: "No lang attribute and no visible content" },
  );

  const boilerplate = BOILERPLATE_PATTERNS.filter((pattern) =>
    pattern.test(normalized.content),
  ).length;
  outcomes.push(
    boilerplate === 0
      ? { status: "pass", evidence: "Normalized text is clean of boilerplate markers" }
      : boilerplate === 1
        ? { status: "partial", evidence: "Normalized text contains 1 boilerplate marker" }
        : {
            status: "fail",
            evidence: `Normalized text contains ${boilerplate} boilerplate markers`,
          },
  );

  return outcomes;
}

export const D2_CHECK_META: Array<{ id: string; weight: number }> = [
  { id: "D2.main_content_in_html", weight: 3 },
  { id: "D2.content_not_hidden_js", weight: 2 },
  { id: "D2.heading_hierarchy", weight: 1 },
  { id: "D2.attributes_text", weight: 2 },
  { id: "D2.specs_parseable", weight: 1 },
  { id: "D2.description_substantive", weight: 1 },
  { id: "D2.locale_coherent", weight: 1 },
  { id: "D2.text_clean", weight: 1 },
];

export function runD2Findings(context: CheckContext): Finding[] {
  const outcomes = runD2Outcomes(context);
  return D2_CHECK_META.map((meta, index) => ({
    checkId: meta.id,
    dimension: "d2" as const,
    type: "deterministic" as const,
    status: outcomes[index].status,
    weight: meta.weight,
    evidence: outcomes[index].evidence,
    details: outcomes[index].details,
  }));
}
