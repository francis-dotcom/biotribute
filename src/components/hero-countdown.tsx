"use client";

import { useEffect, useState } from "react";

type HeroCountdownProps = {
  targetDate: string;
  unit?: string;
};

function nigeriaDayStamp(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");

  return Date.UTC(year, month - 1, day);
}

function targetDayStamp(targetDate: string) {
  const [year, month, day] = targetDate.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

function daysRemaining(targetDate: string) {
  const targetStamp = targetDayStamp(targetDate);
  if (targetStamp === null) {
    return 0;
  }

  const todayStamp = nigeriaDayStamp(new Date());
  const diffDays = Math.ceil((targetStamp - todayStamp) / 86_400_000);
  return Math.max(0, diffDays);
}

export function HeroCountdown({ targetDate, unit = "Days" }: HeroCountdownProps) {
  const [days, setDays] = useState(() => daysRemaining(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDays(daysRemaining(targetDate));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="hero-countdown-badge" aria-label={`${days} ${unit} remaining until June 11, 2026`}>
      <strong>{days}</strong>
      <span className="hero-countdown-unit">{unit}</span>
      <span className="hero-countdown-top">
        <span>Count</span>
        <span>down</span>
      </span>
    </div>
  );
}
