import * as cheerio from "cheerio";

const DEFAULT_MAX_CONTENT_CHARS = 20_000;

const PRICE_PATTERN =
  /(?:[$€£]|kr\b|SEK|USD|EUR|GBP)\s?\d[\d.,]{0,12}|\b\d[\d.,]{0,12}\s?(?:kr|SEK|USD|EUR|GBP)\b/i;
const AVAILABILITY_PATTERN =
  /in stock|out of stock|unavailable|coming soon|waitlist|sold out|back in stock|in inventory|currently available/i;
const CTA_PATTERN =
  /add to (cart|bag|basket)|buy now|checkout|notify me|select a size|pre-?order|add all to cart/i;

export type PdpSignals = {
  priceTexts: string[];
  availabilityTexts: string[];
  ctaTexts: string[];
};

export type NormalizedPdp = {
  title?: string;
  content: string;
  jsonLd: unknown[];
  signals: PdpSignals;
  stats: {
    textLength: number;
    textLines: number;
    truncated: boolean;
  };
};

export type NormalizeOptions = {
  maxContentChars?: number;
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function headingPrefix(tagName: string): string {
  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName[1]);
    return `${"#".repeat(level)} `;
  }
  if (tagName === "li") {
    return "- ";
  }
  if (tagName === "button") {
    return "[button] ";
  }
  return "";
}

function uniqueMatches(
  lines: string[],
  pattern: RegExp,
  limit = 10,
): string[] {
  const seen = new Set<string>();
  const matches: string[] = [];
  for (const line of lines) {
    if (pattern.test(line)) {
      const key = line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        matches.push(line.slice(0, 200));
        if (matches.length >= limit) {
          break;
        }
      }
    }
  }
  return matches;
}

export function normalizeHtml(
  html: string,
  options: NormalizeOptions = {},
): NormalizedPdp {
  const maxContentChars =
    options.maxContentChars ??
    Number(process.env.NORMALIZE_MAX_CHARS ?? DEFAULT_MAX_CONTENT_CHARS);
  const $ = cheerio.load(html);

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    const raw = $(element).contents().text();
    if (raw && raw.trim() !== "") {
      try {
        jsonLd.push(JSON.parse(raw));
      } catch {
        // Ignore invalid JSON-LD blocks.
      }
    }
  });

  $(
    "script,style,noscript,template,svg,iframe,canvas,link,meta,input,select,option",
  ).remove();
  $("nav,header,footer,aside,[role=navigation],[aria-hidden=true]").remove();

  const title =
    collapseWhitespace($("h1").first().text()) ||
    collapseWhitespace($("title").text()) ||
    undefined;

  const lines: string[] = [];
  const seenConsecutive = new Set<string>();
  let previous = "";

  $("body")
    .find("h1,h2,h3,h4,h5,h6,p,li,dt,dd,th,td,button,summary,figcaption")
    .each((_index, element) => {
      const tagName = (element as { tagName?: string }).tagName ?? "";
      const text = collapseWhitespace($(element).text());
      if (text === "" || text === previous) {
        return;
      }
      previous = text;
      if (seenConsecutive.has(text)) {
        return;
      }
      seenConsecutive.add(text);
      lines.push(`${headingPrefix(tagName)}${text}`);
    });

  const fullText = lines.join("\n");
  const truncated = fullText.length > maxContentChars;
  const content = truncated ? fullText.slice(0, maxContentChars) : fullText;
  const contentLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title,
    content,
    jsonLd,
    signals: {
      priceTexts: uniqueMatches(contentLines, PRICE_PATTERN),
      availabilityTexts: uniqueMatches(contentLines, AVAILABILITY_PATTERN),
      ctaTexts: uniqueMatches(contentLines, CTA_PATTERN),
    },
    stats: {
      textLength: content.length,
      textLines: contentLines.length,
      truncated,
    },
  };
}
