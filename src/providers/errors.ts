export type ProviderErrorCode =
  | "missing_credentials"
  | "unauthorized"
  | "rate_limited"
  | "invalid_request"
  | "timeout"
  | "http_error"
  | "malformed_response"
  | "unknown";

export type ProviderErrorOptions = {
  provider: string;
  code: ProviderErrorCode;
  status?: number;
  retryable?: boolean;
  cause?: unknown;
};

export class ProviderError extends Error {
  readonly provider: string;
  readonly code: ProviderErrorCode;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, options: ProviderErrorOptions) {
    super(message);
    this.name = "ProviderError";
    this.provider = options.provider;
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isProviderError(value: unknown): value is ProviderError {
  return value instanceof ProviderError;
}
