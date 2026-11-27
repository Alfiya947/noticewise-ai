type ProxyEnvironment = {
  VERCEL?: string;
  V0_WORKSPACE_ROOT?: string;
};

function readSingleHeader(
  headers: Headers,
  name: string,
): string | null | undefined {
  const value = headers.get(name);
  if (value === null) return undefined;

  const normalized = value.trim();
  return normalized && !/[\r\n,]/.test(normalized) ? normalized : null;
}

function normalizeHost(value: string | null | undefined): string | null {
  if (!value || /[\s,/@\\]/.test(value)) return null;

  try {
    const url = new URL(`https://${value}`);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      return null;
    }
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol)
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(
  request: Request,
  environment: ProxyEnvironment = {
    VERCEL: process.env.VERCEL,
    V0_WORKSPACE_ROOT: process.env.V0_WORKSPACE_ROOT,
  },
): boolean {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return false;

  const origin = normalizeOrigin(rawOrigin);
  if (!origin) return false;

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  const trustsPlatformProxy = environment.VERCEL === "1"
    || Boolean(environment.V0_WORKSPACE_ROOT);
  const forwardedHost = trustsPlatformProxy
    ? readSingleHeader(request.headers, "x-forwarded-host")
    : undefined;
  const forwardedProto = trustsPlatformProxy
    ? readSingleHeader(request.headers, "x-forwarded-proto")
    : undefined;

  if (forwardedHost === null || forwardedProto === null) return false;

  const rawHost = forwardedHost ?? readSingleHeader(request.headers, "host");
  if (rawHost === null) return false;
  const host = normalizeHost(rawHost ?? requestUrl.host);
  if (!host) return false;

  const protocol = (forwardedProto ?? requestUrl.protocol.slice(0, -1)).toLowerCase();
  if (protocol !== "http" && protocol !== "https") return false;

  return origin === `${protocol}://${host}`;
}
