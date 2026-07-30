"use client";

// TEMPORARY verification route, deleted before commit.
// Renders just the welcome sequence so the carriers can be inspected without
// walking the whole intro.
import WelcomeSequence from "@/components/experience/WelcomeSequence";

export default function DevHello() {
  return (
    <main className="h-[100dvh] w-full bg-black">
      <WelcomeSequence onDone={() => {}} />
    </main>
  );
}
