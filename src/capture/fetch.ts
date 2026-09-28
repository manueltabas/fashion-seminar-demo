const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const BLOCK_PATTERNS: Array<[RegExp, string]> = [
  [/access denied/, "access_denied"],
  [/captcha|recaptcha|hcaptcha/, "captcha"],
  [/are you a human/, "human_check"],
  [/just a moment\.\.\./, "cloudflare_challenge"],
  [/attention required! \| cloudflare/, "cloudflare_block"],
  [/cf-chl|cf_chl/, "cloudflare_challenge"],
  [/enable javascript and cookies to continue/, "js_required"],
];

const BLOCK_STATUSES = new Set([401, 403, 407, 429, 503]);

export function detectBotBlock(input: {
  statusCode: number;
  body: string;
  contentType?: string;
}): { blocked: boolean; reason?: string } {
  if (BLOCK_STATUSES.has(input.statusCode)) {
    return { blocked: true, reason: `http_${input.statusCode}` };
  }

  const sample = input.body.slice(0, 4000).toLowerCase();
  for (const [pattern, reason] of BLOCK_PATTERNS) {
    if (pattern.test(sample)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}

export type FetchResult = {
  url: string;
  finalUrl: string;
  statusCode: number;
  ok: boolean;
  blocked: boolean;
  blockReason?: string;
  contentType?: string;
  rawHtml?: string;
  byteSize: number;
  htmlLength: number;
  error?: string;
  fetchedAt: Date;
};

export type FetchPageOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
};

export async function fetchPdpPage(
  url: string,
  options: FetchPageOptions = {},
): Promise<FetchResult> {
  const fetchFn = options.fetchImpl ?? fetch;
  const timeoutMs =
    options.timeoutMs ?? Number(process.env.FETCH_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const userAgent =
    options.userAgent ?? process.env.FETCH_USER_AGENT ?? DEFAULT_USER_AGENT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchedAt = new Date();

  try {
    const response = await fetchFn(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    const contentType = response.headers.get("content-type") ?? undefined;
    const body = await response.text();
    const block = detectBotBlock({
      statusCode: response.status,
      body,
      contentType,
    });
    const isHtml = !contentType || contentType.includes("html");

    return {
      url,
      finalUrl: response.url || url,
      statusCode: response.status,
      ok: response.ok && !block.blocked,
      blocked: block.blocked,
      blockReason: block.reason,
      contentType,
      rawHtml: isHtml ? body : undefined,
      byteSize: new TextEncoder().encode(body).length,
      htmlLength: body.length,
      fetchedAt,
    };
  } catch (error) {
    return {
      url,
      finalUrl: url,
      statusCode: 0,
      ok: false,
      blocked: false,
      byteSize: 0,
      htmlLength: 0,
      error: controller.signal.aborted
        ? "timeout"
        : error instanceof Error
          ? error.message
          : String(error),
      fetchedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
