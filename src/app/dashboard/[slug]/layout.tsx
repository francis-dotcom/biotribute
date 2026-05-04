import type { CSSProperties } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { notFound } from "next/navigation";
import { getTributeThemePreset } from "@/data/tributes";
import { getTributeRecord } from "@/lib/tributes-store";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { slug } = await params;

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }

  const themePreset = getTributeThemePreset(tribute.theme);
  const shellStyle = {
    ...themePreset.variables,
  } as CSSProperties;

  return (
    <main className="landing-shell dashboard-theme-shell" style={shellStyle}>
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes Dashboard</p>
        <h1>{tribute.name}</h1>
        <p className="landing-copy">
          Manage this tribute page, review guest activity, and prepare the public page
          for launch.
        </p>
      </section>

      <DashboardNav slug={slug} />

      {children}
    </main>
  );
}
