import Link from "next/link";
import { confirmFamilyPrivateMessageVerification } from "@/lib/family-private-messages";

type VerifyFamilyMessagePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyFamilyMessagePage({
  searchParams,
}: VerifyFamilyMessagePageProps) {
  const { token } = await searchParams;

  let result:
    | { ok: true; tributeSlug: string; senderName: string; emailNotified: boolean }
    | { ok: false; error: string };

  try {
    const verified = await confirmFamilyPrivateMessageVerification(String(token ?? ""));
    result = { ok: true, ...verified };
  } catch (error) {
    result = {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to verify private family message.",
    };
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>{result.ok ? "Family message confirmed" : "Verification failed"}</h1>
        <p className="landing-copy">
          {result.ok
            ? result.emailNotified
              ? `${result.senderName}'s message is now confirmed, saved, and emailed to the family.`
              : `${result.senderName}'s message is now confirmed and saved for the family.`
            : result.error}
        </p>
        {result.ok ? (
          <div className="console-quick-links">
            <Link href={`/${result.tributeSlug}`}>Return to tribute page</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
