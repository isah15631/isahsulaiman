import * as THREE from "three";

// Solve the classic heart curve (x² + y² − 1)³ − x²y³ = 0 for the radius at a
// given planar angle. Lobes point up, apex points down — a recognisable heart
// silhouette we then inflate into a plump, organic, stone-like form.
function heartRadius(theta: number): number {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const f = (r: number) => Math.pow(r * r - 1, 3) - Math.pow(r, 5) * c * c * s * s * s;

  // Scan outward for the outermost sign change, then bisect.
  let lo = 0.05;
  let prev = f(lo);
  let hi = -1;
  for (let r = 0.1; r <= 2.2; r += 0.02) {
    const cur = f(r);
    if (prev <= 0 && cur > 0) hi = r; // remember the last crossing
    prev = cur;
  }
  if (hi < 0) return 1;
  let a = hi - 0.02;
  let b = hi;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (f(a) * f(m) <= 0) b = m;
    else a = m;
  }
  return (a + b) / 2;
}

// Cheap value noise for organic surface displacement at build time.
function hash(x: number, y: number, z: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** One rigid slab of the heart — a shard, once it breaks. */
export type HeartChunk = { centre: THREE.Vector3; random: number };

/**
 * Builds a plump heart as a non-indexed geometry, with per-face attributes
 * (`aCentroid`, `aRandom`) so the shatter shader can fling each face outward.
 */
export function createHeartGeometry(detail = 96): THREE.BufferGeometry {
  // Start from a smooth sphere; remap every vertex into a pillow-heart.
  const sphere = new THREE.SphereGeometry(1, detail, detail);
  const pos = sphere.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // planar angle in the heart plane (x right, y up); z becomes the "puff" axis
    const theta = Math.atan2(v.y, v.x);
    const R = heartRadius(theta);
    const t = THREE.MathUtils.clamp(v.z, -1, 1); // puff parameter (-1..1)
    const profile = Math.sqrt(Math.max(0, 1 - t * t)); // rounded pillow cross-section

    let x = R * Math.cos(theta) * profile;
    let y = R * Math.sin(theta) * profile;
    let z = t * 0.62; // depth of the pillow

    // gentle organic asymmetry + surface roughness so it reads as tissue-turned-stone
    const bump = (hash(x * 2.3, y * 2.3, z * 2.3) - 0.5) * 0.06;
    const nx = x + bump;
    const ny = y + bump * 0.8;
    const nz = z + (hash(y * 3.1, z * 3.1, x * 3.1) - 0.5) * 0.05;

    pos.setXYZ(i, nx, ny, nz);
  }

  sphere.computeVertexNormals();

  // Normalise scale & centre; tilt slightly for a natural, living pose.
  sphere.computeBoundingBox();
  const bb = sphere.boundingBox!;
  const center = new THREE.Vector3();
  bb.getCenter(center);
  sphere.translate(-center.x, -center.y, -center.z);
  const size = new THREE.Vector3();
  bb.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;
  sphere.scale(scale, scale, scale);

  // Non-indexed so every triangle owns its vertices (needed to explode faces).
  const geo = sphere.toNonIndexed();
  sphere.dispose();

  const p = geo.attributes.position as THREE.BufferAttribute;
  const faceCount = p.count / 3;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  // ---- group faces into rigid chunks ----
  // Faces are bucketed into cells of space. Every face in a cell shares a
  // centre and a random, so the shatter moves them as ONE piece of stone.
  // Letting each triangle fly on its own is what makes a break read as
  // shrapnel rather than as rock.
  const CELL = 0.34;
  const key = (v: THREE.Vector3) =>
    `${Math.floor(v.x / CELL)},${Math.floor(v.y / CELL)},${Math.floor(v.z / CELL)}`;

  const cells = new Map<string, { sum: THREE.Vector3; n: number }>();
  const faceCentroids: THREE.Vector3[] = [];
  const faceKeys: string[] = [];

  for (let f = 0; f < faceCount; f++) {
    const i0 = f * 3;
    a.fromBufferAttribute(p, i0);
    b.fromBufferAttribute(p, i0 + 1);
    c.fromBufferAttribute(p, i0 + 2);
    centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const k = key(centroid);
    faceCentroids.push(centroid.clone());
    faceKeys.push(k);
    const cell = cells.get(k);
    if (cell) {
      cell.sum.add(centroid);
      cell.n++;
    } else {
      cells.set(k, { sum: centroid.clone(), n: 1 });
    }
  }

  // one centre + one random per chunk
  const chunkCentre = new Map<string, THREE.Vector3>();
  const chunkRandom = new Map<string, number>();
  cells.forEach((cell, k) => {
    const mid = cell.sum.clone().multiplyScalar(1 / cell.n);
    chunkCentre.set(k, mid);
    chunkRandom.set(k, hash(mid.x + 3.1, mid.y + 1.7, mid.z + 9.2));
  });

  const centroids = new Float32Array(p.count * 3);
  const randoms = new Float32Array(p.count);
  const chunkCentres = new Float32Array(p.count * 3);
  const chunkRandoms = new Float32Array(p.count);

  for (let f = 0; f < faceCount; f++) {
    const i0 = f * 3;
    const fc = faceCentroids[f];
    const k = faceKeys[f];
    const cc = chunkCentre.get(k)!;
    const cr = chunkRandom.get(k)!;
    const fr = hash(fc.x + 5.7, fc.y + 2.3, fc.z + 1.9);
    for (let j = 0; j < 3; j++) {
      const i = i0 + j;
      centroids[i * 3] = fc.x;
      centroids[i * 3 + 1] = fc.y;
      centroids[i * 3 + 2] = fc.z;
      randoms[i] = fr;
      chunkCentres[i * 3] = cc.x;
      chunkCentres[i * 3 + 1] = cc.y;
      chunkCentres[i * 3 + 2] = cc.z;
      chunkRandoms[i] = cr;
    }
  }

  geo.setAttribute("aCentroid", new THREE.BufferAttribute(centroids, 3));
  geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geo.setAttribute("aChunkCentre", new THREE.BufferAttribute(chunkCentres, 3));
  geo.setAttribute("aChunkRandom", new THREE.BufferAttribute(chunkRandoms, 1));

  // The same chunks the shader flings, readable from JS: the shatter is
  // replayed on the CPU for a handful of frames so each piece can be projected
  // to screen space and handed to the swarm as it turns into a butterfly.
  const chunks: HeartChunk[] = [];
  chunkCentre.forEach((centre, k) => {
    chunks.push({ centre, random: chunkRandom.get(k)! });
  });
  geo.userData.chunks = chunks;
  geo.userData.chunkCount = cells.size;
  return geo;
}

/** Random points on the heart's surface — spawn sites for falling stone. */
export function sampleSurface(
  geo: THREE.BufferGeometry,
  count: number
): Float32Array {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const out = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    // deterministic pick so the motes are stable across renders
    const idx = Math.floor(hash(i * 1.7, i * 0.3 + 4.1, i * 2.9) * p.count);
    v.fromBufferAttribute(p, Math.min(idx, p.count - 1));
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}
