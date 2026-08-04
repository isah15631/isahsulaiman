"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y, dayLight } from "@/lib/descent";
import { DOOR_POS } from "@/lib/approach";

// Real grass: a field of individual blades standing up out of the ground, not a
// texture painted on a flat plane. Each blade is a thin tapered strip of a few
// segments, scattered across the plain and bending in the wind, so the ground has
// the restless, hairy life of grass rather than a smooth green wash.
//
// It is one InstancedBufferGeometry: a single base blade drawn tens of thousands
// of times, each instance carrying its own place, facing, height, tint and wind
// phase. All the motion happens in the vertex shader against one clock, so the
// whole field costs almost nothing on the CPU. It fades up on dayLight, the same
// as the sky and the ground, so there is no grass in the black of space on the way
// down: it grows in with the day it belongs to.

// How far the grass runs, matched to the floor.
const FIELD_R = 24;
// Kept clear of the crash site so blades do not stand in the raw soil scar, and of
// the door's rise so they do not poke through the mound it stands on.
const CRATER_CLEAR = 2.6;
const DOOR_CLEAR = 3.0;

const VERT = /* glsl */ `
  uniform float uTime;
  attribute vec3 iOffset;   // world position of the blade's root
  attribute float iRot;     // facing, radians around Y
  attribute vec2 iScale;    // width, height in metres
  attribute float iPhase;   // wind phase, so blades do not sway in lockstep
  attribute float iTint;    // per-blade colour variation, 0..1
  varying float vY;
  varying float vTint;

  void main(){
    // uv.y runs 0 at the root to 1 at the tip; taper the width to a point.
    vY = uv.y;
    vTint = iTint;
    float taper = 1.0 - vY * 0.92;
    vec3 local = vec3(position.x * iScale.x * taper, position.y * iScale.y, 0.0);

    // Wind: a slow bend that grows toward the tip (vY squared), so the blade hinges
    // at its root and leans rather than sliding sideways. A second cross gust keeps
    // it from being a flat wave.
    float gust = sin(uTime * 1.5 + iPhase + iOffset.x * 0.22 + iOffset.z * 0.18);
    float bendX = gust * 0.14 * vY * vY;
    float bendZ = cos(uTime * 1.1 + iPhase * 1.3) * 0.07 * vY * vY;
    local.x += bendX;
    local.z += bendZ;

    // Face the blade by its own rotation, then plant it at its root in the world.
    float c = cos(iRot), s = sin(iRot);
    vec3 world = vec3(c * local.x + s * local.z, local.y, -s * local.x + c * local.z);
    world += iOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uDay;
  varying float vY;
  varying float vTint;

  void main(){
    // Green climbing from a deep shaded root to a brighter, sunnier tip, with a
    // spread of tints across the field so it is not one flat green.
    vec3 root = vec3(0.10, 0.22, 0.06);
    vec3 tip  = vec3(0.46, 0.64, 0.22);
    vec3 col = mix(root, tip, vY);
    col *= 0.75 + 0.5 * vTint;
    // a touch of contact shade right at the base
    col *= 0.7 + 0.3 * smoothstep(0.0, 0.22, vY);

    float a = uDay;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export default function GrassField({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const narrow = size.width < 640;
  const count = narrow ? 9000 : 26000;

  const geometry = useMemo(() => {
    // One blade: an upright strip standing from y=0 to y=1, a few segments tall so
    // the wind can curve it. Built once and drawn per instance.
    const base = new THREE.PlaneGeometry(1, 1, 1, 4);
    base.translate(0, 0.5, 0);

    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.attributes.position);
    geo.setAttribute("uv", base.attributes.uv);

    const off = new Float32Array(count * 3);
    const rot = new Float32Array(count);
    const scl = new Float32Array(count * 2);
    const pha = new Float32Array(count);
    const tin = new Float32Array(count);

    // Deterministic scatter, so it is the same field every mount.
    let seed = 20873;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < count; i++) {
      // A point in the disk, kept out of the crater and the door's rise. Uniform
      // over area (sqrt), nudged outward if it lands in a cleared zone.
      let x = 0;
      let z = 0;
      for (let tries = 0; tries < 6; tries++) {
        const rr = FIELD_R * Math.sqrt(rand());
        const th = rand() * Math.PI * 2;
        x = Math.cos(th) * rr;
        z = Math.sin(th) * rr;
        const inCrater = x * x + z * z < CRATER_CLEAR * CRATER_CLEAR;
        const dx = x - DOOR_POS[0];
        const dz = z - DOOR_POS[2];
        const inDoor = dx * dx + dz * dz < DOOR_CLEAR * DOOR_CLEAR;
        if (!inCrater && !inDoor) break;
      }

      off[i * 3] = x;
      off[i * 3 + 1] = FLOOR_Y;
      off[i * 3 + 2] = z;
      rot[i] = rand() * Math.PI * 2;
      // Nearer blades a touch taller and broader; all of it small enough to read
      // as grass and not reeds.
      scl[i * 2] = 0.018 + rand() * 0.016; // width
      scl[i * 2 + 1] = 0.16 + rand() * 0.2; // height
      pha[i] = rand() * 6.283;
      tin[i] = rand();
    }

    geo.setAttribute("iOffset", new THREE.InstancedBufferAttribute(off, 3));
    geo.setAttribute("iRot", new THREE.InstancedBufferAttribute(rot, 1));
    geo.setAttribute("iScale", new THREE.InstancedBufferAttribute(scl, 2));
    geo.setAttribute("iPhase", new THREE.InstancedBufferAttribute(pha, 1));
    geo.setAttribute("iTint", new THREE.InstancedBufferAttribute(tin, 1));
    geo.instanceCount = count;
    // A generous bound so it is never wrongly culled as the camera moves through.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), FIELD_R * 2);
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = nowRef.current;
      mat.current.uniforms.uDay.value = dayLight(nowRef.current);
    }
  });

  return (
    <mesh geometry={geometry} renderOrder={1} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        side={THREE.DoubleSide}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uDay: { value: 0 },
        }}
      />
    </mesh>
  );
}
