"use client";

// The wall the torch is strapped to: a course of dark stone bricks in running
// bond, each with its mortar line drawn round it so the coursing reads. It sits
// at the very back of the room, and it is masked to a soft pool around the torch
// — a wall in the dark is only visible where a fire is throwing light on it, so
// the bricks come up out of the black near the flame and sink back into it toward
// the edges. Like everything else in here it is colourless until the torch is
// lit, then it warms with the rest of the world.

export default function BrickWall() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        // Only the torch-lit patch of wall is ever seen; the rest stays black.
        WebkitMaskImage:
          "radial-gradient(ellipse 62% 66% at 50% 12%, #000 0%, rgba(0,0,0,0.9) 34%, transparent 74%)",
        maskImage:
          "radial-gradient(ellipse 62% 66% at 50% 12%, #000 0%, rgba(0,0,0,0.9) 34%, transparent 74%)",
      }}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 480 480"
      >
        <defs>
          <pattern
            id="bricks"
            width="120"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* mortar behind the bricks */}
            <rect x="0" y="0" width="120" height="60" fill="#181310" />
            {/* top course */}
            <rect x="2" y="2" width="56" height="26" rx="1.5" fill="#332a22" stroke="#0c0806" strokeWidth="1.4" />
            <rect x="62" y="2" width="56" height="26" rx="1.5" fill="#2e2620" stroke="#0c0806" strokeWidth="1.4" />
            {/* lower course, offset half a brick for running bond */}
            <rect x="-28" y="32" width="56" height="26" rx="1.5" fill="#2f2720" stroke="#0c0806" strokeWidth="1.4" />
            <rect x="32" y="32" width="56" height="26" rx="1.5" fill="#352c23" stroke="#0c0806" strokeWidth="1.4" />
            <rect x="92" y="32" width="56" height="26" rx="1.5" fill="#2e2620" stroke="#0c0806" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bricks)" />
      </svg>
    </div>
  );
}
