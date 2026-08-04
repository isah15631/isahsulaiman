"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, type MutableRefObject } from "react";
import * as THREE from "three";
import type { PerspectiveCamera } from "three";
import { EYE_Y, LOOK_Y } from "@/lib/descent";
import { approachP, revealP, throughCamQ } from "@/lib/approach";
import { fitDistance } from "./OrbScene";

// The camera after the landing: off the crater, onto the vista, in to the door,
// and through it.
//
// It does not fight the descent rig, it waits for it. While the reveal has not
// begun this does nothing and the rig owns the shot; the moment it starts this
// takes over, because it runs at a later priority and writes the camera last.
//
// Three moves, blended by time and laid end to end. Each later one only has any
// effect once the one before it has finished, so they add without a switch: pull
// back off the crater to take in the whole desert, then go from that vista in to
// a standoff at the door, then push on through the opening into the dark. The
// desert stays in frame the whole way; only the black of the doorway ends it.

// Eye height above the sand at the threshold, and how far back the standoff sits.
const EYE_ABOVE = 1.7;
const STANDOFF = 3.1;
// Height of the opening's centre above the door's base (matches DesertDoor).
const DOOR_MID = 0.87;
// How far above the door the gaze rides at the standoff, so the door sits low in
// the frame with the sky above it. The push-through then drops it into the mouth.
const VISTA_LIFT = 0.5;

export default function ApproachCam({
  nowRef,
  doorPos,
}: {
  nowRef: MutableRefObject<number>;
  doorPos: [number, number, number];
}) {
  const { camera, size } = useThree();
  const dist = useMemo(
    () => fitDistance(size.width, size.height),
    [size.width, size.height]
  );

  const vecs = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      a: new THREE.Vector3(),
      aLook: new THREE.Vector3(),
      v: new THREE.Vector3(),
      vLook: new THREE.Vector3(),
      b: new THREE.Vector3(),
      bLook: new THREE.Vector3(),
      t: new THREE.Vector3(),
      tLook: new THREE.Vector3(),
    }),
    []
  );

  useFrame(() => {
    const now = nowRef.current;
    const rp = revealP(now);
    if (rp <= 0) return; // the rig still has the landing

    const [cx, cy, cz] = doorPos;

    // A: where the landing left the camera, the same pose the rig holds.
    vecs.a.set(0, EYE_Y, dist);
    vecs.aLook.set(0, LOOK_Y, 0);
    // V: pulled back and lifted to take in the sweep of the snow world — the
    // crash site in the foreground, the door out on the field, the mountains
    // behind. Not pulled back so far that the swarm turns to confetti, though:
    // the scale is carried by the towering far mountains, not by shrinking the
    // whole shot, so this sits at a middle distance where the butterflies still
    // read as butterflies.
    vecs.v.set(0.85, 2.05, dist + 4.5);
    vecs.vLook.set(1.2, 1.25, -8.0);
    // B: standing off the door, gaze lifted so it stands low against the sky.
    vecs.b.set(cx, cy + EYE_ABOVE, cz + STANDOFF);
    vecs.bLook.set(cx, cy + DOOR_MID + VISTA_LIFT, cz);
    // T: the final hold, kept SHORT of the portal so the camera never crosses its
    // plane — we do not pass through it. It eases in a touch closer while gazing at
    // the oval, and the black closes over from here instead of a push-through.
    vecs.t.set(cx, cy + DOOR_MID + 0.35, cz + 1.5);
    vecs.tLook.set(cx, cy + DOOR_MID + 0.1, cz);

    // pull back onto the vista
    vecs.pos.copy(vecs.a).lerp(vecs.v, rp);
    vecs.look.copy(vecs.aLook).lerp(vecs.vLook, rp);

    // then in from the vista to the door (no effect until the reveal is done)
    const ap = approachP(now);
    if (ap > 0) {
      vecs.pos.copy(vecs.v).lerp(vecs.b, ap);
      vecs.look.copy(vecs.vLook).lerp(vecs.bLook, ap);
    }

    // then through — eased OUT, so it takes up the approach's momentum and does
    // not stall at the threshold before going in
    const tq = throughCamQ(now);
    if (tq > 0) {
      vecs.pos.lerp(vecs.t, tq);
      vecs.look.lerp(vecs.tLook, tq);
    }

    const cam = camera as PerspectiveCamera;
    cam.position.copy(vecs.pos);
    cam.lookAt(vecs.look);
    cam.updateProjectionMatrix();
    // Negative priority: after the rig (-50), but a POSITIVE priority would hand
    // us the render loop and switch off automatic rendering (a black frame).
  }, -40);

  return null;
}
