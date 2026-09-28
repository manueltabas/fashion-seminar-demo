import { ProviderError, type ProviderErrorCode } from "./errors";

const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

function codeForStatus(status: number): ProviderErrorCode {
  if (status === 401 || status === 403) {
    return "unauthorized";
  }
  if (status === 429) {
    return "rate_limited";
  }
  if (status >= 400 && status < 500) {
    return "invalid_request";
  }
  return "http_error";
}

export type PostJsonOptions = {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export async function postJson<T>(options: PostJsonOptions): Promise<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(options.url, {
      method: "POST",
      headers: { "content-type": "application/json", ...options.headers },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ProviderError(`${options.provider} request timed out`, {
        provider: options.provider,
        code: "timeout",
        retryable: true,
        cause: error,
      });
    }
    throw new ProviderError(
      `${options.provider} request failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { provider: options.provider, code: "unknown", retryable: true, cause: error },
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ProviderError(
      `${options.provider} returned HTTP ${response.status}`,
      {
        provider: options.provider,
        code: codeForStatus(response.status),
        status: response.status,
        retryable: RETRYABLE_STATUS.has(response.status),
      },
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ProviderError(`${options.provider} returned a non-JSON response`, {
      provider: options.provider,
      code: "malformed_response",
      cause: error,
    });
  }
}
