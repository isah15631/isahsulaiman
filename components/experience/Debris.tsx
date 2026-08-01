"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { BEAT, FLOOR_Y } from "@/lib/descent";

// What the moon leaves on the ground.
//
// It comes down as a rock, so where it lands there is a rock: one dark boulder
// half sunk in the crater, and a scatter of broken chunks thrown out across the
// snow around it. They fly out on the frame of impact, arc, land, and stay,
// settling into the snow a beat before the swarm lifts off it. That order is the
// whole point of them: it hits, the pieces come to rest, and only then do they
// rise as butterflies and pour into the door.
//
// Everything reads its state from the one clock, the same as the rest of the
// descent: before the impact there is nothing here, and after it every chunk is
// exactly as far through its own short flight as the time says it is. No physics
// stepper, so it cannot drift on a slow machine and it can be seeked to any
// instant and held still.

// How many chunks are thrown out around the boulder.
const COUNT = 22;

// The sun the snow is lit by, matching the floor and the drifts.
const SUN = "normalize(vec3(0.22, 1.0, 0.18))";

const VERT = /* glsl */ `
  varying vec3 vN;
  void main(){
    // World-space normal, so the sun is a fixed direction in the world and the
    // snow dusting stays on whichever face points up after the chunk lands.
    vN = mat3(modelMatrix) * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uSnowy;
  varying vec3 vN;
  void main(){
    vec3 n = normalize(vN);
    float sun = max(dot(n, ${SUN}), 0.0);
    // Lit face, plus a cold sky fill so the shadowed side is blue rather than
    // dead black, the same way the snow around it is lit.
    vec3 col = uColor * (0.34 + 0.72 * sun)
             + uColor * vec3(0.30, 0.40, 0.58) * 0.26 * (1.0 - sun);
    // Snow caught on the upward faces, so the debris wears the same weather as
    // the ground it is lying in.
    float up = smoothstep(0.30, 0.85, n.y);
    col = mix(col, vec3(0.90, 0.93, 1.0) * (0.5 + 0.5 * sun), up * uSnowy);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function rand(i: number) {
  const x = Math.sin(i * 78.233 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Chunk = {
  target: THREE.Vector3; // where it comes to rest
  scale: THREE.Vector3; // baked-in irregular shape
  arc: number; // how high it flies on the way there
  fly: number; // seconds from impact to landing
  axis: THREE.Vector3; // tumble
  spin: number;
  color: THREE.Color;
  snowy: number;
};

// The point everything is thrown from: the crater, just above the floor.
const LAUNCH = new THREE.Vector3(0, FLOOR_Y + 0.25, 0);

const ROCK = new THREE.Color(0.24, 0.235, 0.25);
const ROCK_DARK = new THREE.Color(0.15, 0.148, 0.165);
const ICE = new THREE.Color(0.72, 0.80, 0.92);

function makeChunks(): Chunk[] {
  const out: Chunk[] = [];

  // The boulder: the moon itself, come to rest as a dark rock in the crater.
  out.push({
    target: new THREE.Vector3(0.1, FLOOR_Y + 0.16, 0.15),
    scale: new THREE.Vector3(0.62, 0.44, 0.58),
    arc: 0.3,
    fly: 0.42,
    axis: new THREE.Vector3(0.3, 0.8, 0.2).normalize(),
    spin: 1.6,
    color: ROCK_DARK,
    snowy: 0.5,
  });

  for (let i = 0; i < COUNT; i++) {
    const a = rand(i + 1);
    const b = rand(i + 37);
    const c = rand(i + 91);
    const d = rand(i + 143);
    const ang = a * Math.PI * 2;
    const r = 1.1 + b * 2.7; // scattered out across the snow
    const size = 0.09 + c * 0.2;
    const isIce = d > 0.58;
    out.push({
      target: new THREE.Vector3(
        Math.cos(ang) * r,
        FLOOR_Y + size * 0.32,
        Math.sin(ang) * r
      ),
      scale: new THREE.Vector3(
        size * (0.7 + a * 0.6),
        size * (0.6 + c * 0.5),
        size * (0.7 + b * 0.6)
      ),
      // farther chunks are thrown higher and take a touch longer to land
      arc: 0.5 + r * 0.32 + c * 0.4,
      fly: 0.5 + b * 0.32,
      axis: new THREE.Vector3(a - 0.5, b - 0.2, 0.5 - c).normalize(),
      spin: 4.0 + c * 6.0,
      color: isIce ? ICE : a > 0.5 ? ROCK : ROCK_DARK,
      snowy: isIce ? 0.16 : 0.55,
    });
  }
  return out;
}

export default function Debris({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const chunks = useMemo(makeChunks, []);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const materials = useMemo(
    () =>
      chunks.map(
        (ch) =>
          new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
              uColor: { value: ch.color },
              uSnowy: { value: ch.snowy },
            },
          })
      ),
    [chunks]
  );

  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = nowRef.current - BEAT.impact;
    // Nothing before it lands: the whole thing is the aftermath of the impact.
    if (t <= 0) {
      g.visible = false;
      return;
    }
    g.visible = true;

    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const m = g.children[i] as THREE.Mesh;
      if (!m) continue;

      const k = Math.min(1, t / ch.fly);
      // horizontal ease-out: fast off the impact, slowing as it comes to rest
      const eh = 1 - (1 - k) * (1 - k);
      const x = LAUNCH.x + (ch.target.x - LAUNCH.x) * eh;
      const z = LAUNCH.z + (ch.target.z - LAUNCH.z) * eh;
      // an arc up and back down onto its landing height
      const y =
        LAUNCH.y + (ch.target.y - LAUNCH.y) * k + ch.arc * Math.sin(Math.PI * k);
      m.position.set(x, y, z);

      // tumbling in flight, frozen the instant it lands
      q.setFromAxisAngle(ch.axis, Math.min(t, ch.fly) * ch.spin);
      m.quaternion.copy(q);
    }
  });

  return (
    <group ref={group} visible={false}>
      {chunks.map((ch, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={materials[i]}
          scale={ch.scale}
        />
      ))}
    </group>
  );
}
