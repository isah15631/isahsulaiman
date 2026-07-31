"use client";

import PortraitAssembly from "@/components/experience/PortraitAssembly";
import { ABOUT } from "@/lib/content";

// The portrait on its own, at the size it renders in About.
//
// It lives four sections deep inside a scroll-driven 3d room, which is a long
// way to travel to look at one canvas — and the assembly only plays once, so
// getting it wrong meant reloading the whole experience to see the next
// attempt. Reload this instead.

export default function DevPortrait() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0806] p-10">
      <div className="w-[300px] overflow-hidden rounded-[9999px_9999px_18px_18px] aspect-[3/4]">
        <PortraitAssembly src={ABOUT.photo} alt={ABOUT.name} />
      </div>
    </main>
  );
}
