"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type DashboardNavProps = {
  slug: string;
};

export function DashboardNav({ slug }: DashboardNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  const links = [
    { href: `/dashboard/${slug}${tokenQuery}`, label: "Overview" },
    { href: `/dashboard/${slug}/builder${tokenQuery}`, label: "Page Builder" },
    { href: `/dashboard/${slug}/edit${tokenQuery}`, label: "Edit Tribute" },
    { href: `/dashboard/${slug}/theme${tokenQuery}`, label: "Theme" },
    { href: `/dashboard/${slug}/gallery${tokenQuery}`, label: "Images" },
    { href: `/dashboard/${slug}/messages${tokenQuery}`, label: "Messages" },
    { href: `/biotribute/${slug}`, label: "Public Tribute" },
  ];

  return (
    <nav className="dashboard-nav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href.split("?")[0] ? "is-active" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
