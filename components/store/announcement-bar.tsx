"use client";

import { useEffect, useState } from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  const list = messages.filter(Boolean);

  useEffect(() => {
    if (list.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 4500);
    return () => clearInterval(id);
  }, [list.length]);

  if (list.length === 0) return null;

  return (
    <div className="bg-obsidian text-ivory">
      <div className="container-wide flex h-10 items-center justify-center overflow-hidden text-center">
        <p key={index} className="animate-fade-in text-[11px] uppercase tracking-[0.22em] text-ivory/90">
          {list[index]}
        </p>
      </div>
    </div>
  );
}
