"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardNavProps = {
  slug: string;
};

export function DashboardNav({ slug }: DashboardNavProps) {
  const pathname = usePathname();

  const links = [
    { href: `/dashboard/${slug}`, label: "Overview" },
    { href: `/dashboard/${slug}/builder`, label: "Page Builder" },
    { href: `/dashboard/${slug}/edit`, label: "Edit Tribute" },
    { href: `/dashboard/${slug}/theme`, label: "Theme" },
    { href: `/dashboard/${slug}/gallery`, label: "Images" },
    { href: `/dashboard/${slug}/messages`, label: "Messages" },
    { href: `/${slug}`, label: "Public Tribute" },
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
