"use client";

import dynamic from "next/dynamic";

// The entire experience is client-side only (three.js, Howler audio, animation).
// ssr:false keeps window-dependent libs (Howler) off the server.
const Experience = dynamic(() => import("@/components/experience/Experience"), {
  ssr: false,
});

export default function Home() {
  return <Experience />;
}
