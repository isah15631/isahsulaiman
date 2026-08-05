"use client";

// TEMP: mounts the lit room directly so the grotto wall, wet-slate parchments,
// and the depth navigation can be seen without playing the intro. Delete after.
import Sections from "@/components/experience/Sections";

export default function DevRoom() {
  return <Sections ignited onIgnite={() => {}} />;
}
