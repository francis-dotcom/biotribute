import Link from "next/link";
import { confirmMessageVerification } from "@/lib/messages";

type VerifyMessagePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyMessagePage({ searchParams }: VerifyMessagePageProps) {
  const { token } = await searchParams;

  let result:
    | { ok: true; slug: string; author: string; alreadyVerified: boolean }
    | { ok: false; error: string };

  try {
    const verified = await confirmMessageVerification(String(token ?? ""));
    result = { ok: true, ...verified };
  } catch (error) {
    result = {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to verify message.",
    };
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>{result.ok ? "Email confirmed" : "Verification failed"}</h1>
        <p className="landing-copy">
          {result.ok
            ? result.alreadyVerified
              ? `${result.author}'s message was already confirmed.`
              : `${result.author}'s message is now confirmed and ready for family review.`
            : result.error}
        </p>
        {result.ok ? (
          <div className="console-quick-links">
            <Link href={`/${result.slug}`}>Return to tribute page</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
