import { ftch } from "@luna/core";

export const DEFAULT_NETWORK_TIMEOUT_MS = 15_000;

export class LunaticNetworkTimeoutError extends Error {
  constructor(
    public readonly requestLabel: string,
    public readonly timeoutMs: number,
  ) {
    super(`${requestLabel} timed out after ${Math.round(timeoutMs / 1000)}s`);
    this.name = "LunaticNetworkTimeoutError";
  }
}


export async function withNetworkTimeout<T>(
  promise: Promise<T>,
  requestLabel: string,
  timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS,
): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(
          () => reject(new LunaticNetworkTimeoutError(requestLabel, timeoutMs)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

/*
 * @luna/core `ftch` is the client-safe transport already used by TidaLuna.
 * Its public convenience methods do not expose a stable AbortSignal contract,
 * so timeouts here bound the caller lifecycle without depending on private
 * transport internals.
 */
type FtchJsonOptions = Parameters<typeof ftch.json>[1];

export function requestJson<T>(
  url: string,
  options?: FtchJsonOptions,
  timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS,
): Promise<T> {
  return withNetworkTimeout(ftch.json<T>(url, options), `GET ${url}`, timeoutMs);
}

export function requestText(
  url: string,
  timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS,
): Promise<string> {
  return withNetworkTimeout(ftch.text(url), `GET ${url}`, timeoutMs);
}

/*
 * Native fetch is still required by Plugin Store because it consumes ETag /
 * Last-Modified / 304 metadata. Unlike ftch, this path can be actually aborted.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  let upstreamAbort: (() => void) | undefined;

  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort(upstreamSignal.reason);
    else {
      upstreamAbort = () => controller.abort(upstreamSignal.reason);
      upstreamSignal.addEventListener("abort", upstreamAbort, { once: true });
    }
  }

  const timer = window.setTimeout(
    () => controller.abort(new LunaticNetworkTimeoutError(String(input), timeoutMs)),
    timeoutMs,
  );

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason instanceof LunaticNetworkTimeoutError) {
      throw controller.signal.reason;
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    if (upstreamSignal && upstreamAbort) {
      upstreamSignal.removeEventListener("abort", upstreamAbort);
    }
  }
}
