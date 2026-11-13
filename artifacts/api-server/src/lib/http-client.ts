/**
 * Server-only, opt-in HTTPS JSON transport. No configuration or I/O at import.
 * The operator must supply a trusted base; this is not a network SSRF firewall.
 */
export type HttpClientErrorCode =
  | "CONFIGURATION" | "NETWORK" | "TIMEOUT" | "CANCELLED" | "HTTP_STATUS"
  | "INVALID_JSON" | "INVALID_RESPONSE" | "RESPONSE_TOO_LARGE";

const messages: Record<HttpClientErrorCode, string> = {
  CONFIGURATION: "Invalid HTTPS client configuration or request.",
  NETWORK: "HTTPS transport failed.",
  TIMEOUT: "HTTPS request timed out.",
  CANCELLED: "HTTPS request was cancelled.",
  HTTP_STATUS: "HTTPS response has an unsuccessful status.",
  INVALID_JSON: "HTTPS response is not valid JSON.",
  INVALID_RESPONSE: "HTTPS response failed validation.",
  RESPONSE_TOO_LARGE: "HTTPS response exceeds the size limit.",
};

export class HttpClientError extends Error {
  readonly code: HttpClientErrorCode;
  readonly status?: number;

  constructor(code: HttpClientErrorCode, status?: number) {
    super(messages[code]);
    this.name = "HttpClientError";
    this.code = code;
    this.status = status;
  }

  toJSON(): { name: string; code: HttpClientErrorCode; message: string; status?: number } {
    return { name: this.name, code: this.code, message: this.message, status: this.status };
  }
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type QueryValue = string | number | boolean;
export type Query = Readonly<Record<string, QueryValue | readonly QueryValue[] | undefined>>;
export type FetchTransport = typeof globalThis.fetch;

export interface HttpClientConfig {
  /** Trusted operator configuration, never an end-user URL. Directory semantics. */
  baseUrl: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  token?: string;
  /** Additional per-request headers allowed by the operator. Reserved headers stay forbidden. */
  allowedRequestHeaders?: readonly string[];
}

export interface JsonRequestOptions<T> {
  query?: Query;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
  /** Synchronous runtime parser, e.g. value => schema.parse(value). Not called for empty bodies. */
  validate?: (value: unknown) => T;
}

export interface JsonResponse<T> {
  status: number;
  data: T | undefined;
}

export interface HttpClient {
  get<T = unknown>(path: string, options?: JsonRequestOptions<T>): Promise<JsonResponse<T>>;
  post<T = unknown>(path: string, body: JsonValue, options?: JsonRequestOptions<T>): Promise<JsonResponse<T>>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_BYTES = 1_048_576;
const MAX_BYTES = 16_777_216;
const headerName = /^[!#$%&'*+.^_`|~0-9a-z-]+$/;
const reservedHeader = /^(authorization|proxy-.*|cookie2?|host|connection|keep-alive|te|trailer|transfer-encoding|upgrade|content-.*|accept|accept-encoding|expect|origin|referer|sec-.*)$/;

function invalid(): never {
  throw new HttpClientError("CONFIGURATION");
}

function boundedInteger(value: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) invalid();
  return value;
}

function trustedBase(value: string): URL {
  try {
    if (typeof value !== "string" || value !== value.trim() || /[\s\\]/.test(value)) invalid();
    const base = new URL(value);
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) invalid();
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    return base;
  } catch {
    return invalid();
  }
}

function destination(base: URL, path: string, query?: Query): URL {
  try {
    // No absolute/root-relative destinations, embedded query, fragment or traversal.
    if (typeof path !== "string" || /^[\/\\]/.test(path) || /[:\\?#\s]/.test(path)) invalid();
    const decoded = decodeURIComponent(path);
    if (/[:\\?#\s]/.test(decoded) || decoded.startsWith("/") ||
      decoded.split("/").some(part => part === "." || part === "..") ||
      /%2f|%5c|%25/i.test(path)) invalid();
    const url = new URL(path, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) ||
      url.username || url.password) invalid();
    for (const [key, entry] of Object.entries(query ?? {})) {
      if (entry === undefined) continue;
      for (const value of Array.isArray(entry) ? entry : [entry]) {
        if (!["string", "number", "boolean"].includes(typeof value) ||
          (typeof value === "number" && !Number.isFinite(value))) invalid();
        url.searchParams.append(key, String(value));
      }
    }
    return url;
  } catch {
    return invalid();
  }
}

// Cancellation is best effort and must not hide the original safe error or block cleanup.
function discard(body: ReadableStream<Uint8Array> | null): void {
  if (body && !body.locked) void body.cancel().catch(() => {});
}

export function createHttpClient(config: HttpClientConfig, transport?: FetchTransport): HttpClient {
  if (!config || typeof config !== "object") invalid();
  const base = trustedBase(config.baseUrl);
  const timeoutMs = boundedInteger(config.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const maxBytes = boundedInteger(config.maxResponseBytes ?? DEFAULT_MAX_BYTES, MAX_BYTES);
  const token = config.token;
  if (token !== undefined && (typeof token !== "string" || !/^[\x21-\x7e]+$/.test(token))) invalid();
  const allowedHeaders = new Set<string>();
  if (config.allowedRequestHeaders !== undefined && !Array.isArray(config.allowedRequestHeaders)) invalid();
  for (const name of config.allowedRequestHeaders ?? []) {
    if (typeof name !== "string") invalid();
    const normalized = name.toLowerCase();
    if (!headerName.test(normalized) || reservedHeader.test(normalized)) invalid();
    allowedHeaders.add(normalized);
  }
  const fetcher = transport ?? globalThis.fetch;
  if (typeof fetcher !== "function") invalid();

  async function request<T>(
    method: "GET" | "POST", path: string, body: JsonValue | undefined, options: JsonRequestOptions<T> = {},
  ): Promise<JsonResponse<T>> {
    const url = destination(base, path, options.query);
    const headers = new Headers({ accept: "application/json" });
    let serialized: string | undefined;
    try {
      for (const [name, value] of Object.entries(options.headers ?? {})) {
        if (!allowedHeaders.has(name.toLowerCase()) || typeof value !== "string" || /[\r\n]/.test(value)) invalid();
        headers.set(name, value);
      }
      if (token !== undefined) headers.set("authorization", `Bearer ${token}`);
      if (method === "POST") {
        serialized = JSON.stringify(body);
        if (serialized === undefined) invalid();
        headers.set("content-type", "application/json");
      }
    } catch {
      return invalid();
    }

    const controller = new AbortController();
    let stopped: HttpClientError | undefined;
    let rejectStop!: (error: HttpClientError) => void;
    const interrupted = new Promise<never>((_, reject) => { rejectStop = reject; });
    const stop = (code: "TIMEOUT" | "CANCELLED"): void => {
      if (stopped) return;
      stopped = new HttpClientError(code);
      rejectStop(stopped);
      // Do not propagate the caller's potentially sensitive signal.reason.
      controller.abort();
    };
    const onAbort = (): void => stop("CANCELLED");
    options.signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => stop("TIMEOUT"), timeoutMs);
    let response: Response | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let consumed = false;
    try {
      if (options.signal?.aborted) stop("CANCELLED");
      if (stopped) await interrupted;
      const pending = Promise.resolve().then(() => fetcher(url, {
        method, headers, body: serialized, signal: controller.signal,
        redirect: "manual", credentials: "omit",
      })).then(value => {
        // Even an injected transport that ignores abort cannot leak a late response body.
        if (stopped) discard(value.body);
        return value;
      });
      response = await Promise.race([pending, interrupted]);
      if (response.status < 200 || response.status >= 300) {
        throw new HttpClientError("HTTP_STATUS", response.status);
      }
      // Defensive rejection if an injected/custom transport followed a redirect anyway.
      if (response.redirected || response.type === "opaqueredirect") {
        throw new HttpClientError("HTTP_STATUS", response.status);
      }
      const length = response.headers.get("content-length");
      if (length !== null && /^\d+$/.test(length) && Number(length) > maxBytes) {
        throw new HttpClientError("RESPONSE_TOO_LARGE", response.status);
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (response.body) {
        reader = response.body.getReader();
        while (true) {
          const chunk = await Promise.race([reader.read(), interrupted]);
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > maxBytes) throw new HttpClientError("RESPONSE_TOO_LARGE", response.status);
          chunks.push(chunk.value);
        }
      }
      consumed = true;
      if (size === 0) return { status: response.status, data: undefined };
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      let value: unknown;
      try {
        value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch {
        throw new HttpClientError("INVALID_JSON", response.status);
      }
      let data: T;
      if (options.validate) {
        try { data = options.validate(value); } catch {
          throw new HttpClientError("INVALID_RESPONSE", response.status);
        }
      } else {
        // Generic parameters do not validate the remote data. Use validate at trust boundaries.
        data = value as T;
      }
      return { status: response.status, data };
    } catch (error) {
      if (stopped) throw stopped;
      // Rebuild even our error type: custom transports must not inject fields/causes.
      if (error instanceof HttpClientError && Object.hasOwn(messages, error.code)) {
        const status = Number.isInteger(error.status) && error.status! >= 100 && error.status! <= 599
          ? error.status : undefined;
        throw new HttpClientError(error.code, status);
      }
      throw new HttpClientError("NETWORK");
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      if (reader) {
        if (!consumed) void reader.cancel().catch(() => {});
        reader.releaseLock();
      } else if (response) discard(response.body);
      controller.abort();
    }
  }

  return {
    get: <T = unknown>(path: string, options?: JsonRequestOptions<T>) => request<T>("GET", path, undefined, options),
    post: <T = unknown>(path: string, body: JsonValue, options?: JsonRequestOptions<T>) => request<T>("POST", path, body, options),
  };
}

/** Opt-in only: reads exactly these three server environment keys when called. */
export function createHttpClientFromEnv(
  env: Partial<Pick<NodeJS.ProcessEnv, "EXTERNAL_API_BASE_URL" | "EXTERNAL_API_TIMEOUT_MS" | "EXTERNAL_API_TOKEN">> = process.env,
  transport?: FetchTransport,
): HttpClient {
  const rawTimeout = env.EXTERNAL_API_TIMEOUT_MS;
  if (rawTimeout !== undefined && !/^[0-9]+$/.test(rawTimeout)) invalid();
  return createHttpClient({
    baseUrl: env.EXTERNAL_API_BASE_URL ?? "",
    timeoutMs: rawTimeout === undefined ? undefined : Number(rawTimeout),
    token: env.EXTERNAL_API_TOKEN,
  }, transport);
}
