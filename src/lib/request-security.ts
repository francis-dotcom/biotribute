export function isSameOriginRequest(request: Request) {
  let expectedOrigin = "";
  try {
    const url = new URL(request.url);
    expectedOrigin = url.origin;
  } catch {
    return false;
  }

  const originHeader = request.headers.get("origin")?.trim();
  if (originHeader) {
    try {
      return new URL(originHeader).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  const refererHeader = request.headers.get("referer")?.trim();
  if (refererHeader) {
    try {
      return new URL(refererHeader).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}
