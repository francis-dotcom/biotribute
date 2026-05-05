function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export async function verifyTurnstileToken(token?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (isProductionEnvironment()) {
      throw new Error(
        "Bot verification is not configured for production. Set TURNSTILE_SECRET_KEY.",
      );
    }

    return true;
  }

  if (!token?.trim()) {
    return false;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token.trim(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}
