"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )mh_sid=([^;]+)/);
  if (match) return match[1];
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  document.cookie = `mh_sid=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  return id;
}

// First-party, privacy-conscious page-view beacon. Sends anonymous,
// session-level data only. Disabled entirely when the visitor opts out.
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("mh_analytics_consent") === "denied") return;
    if (pathname.startsWith("/admin")) return;

    const payload = {
      type: "PAGE_VIEW",
      sessionId: getSessionId(),
      path: pathname,
      referrer: document.referrer || null,
      utmSource: searchParams.get("utm_source"),
      utmMedium: searchParams.get("utm_medium"),
      utmCampaign: searchParams.get("utm_campaign"),
    };

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
