import * as THREE from "three";

// A glass sphere, pre-broken into the pieces it will fly apart into.
//
// The sphere itself is the easy part. What matters is how it is divided: the
// pieces have to be irregular polygonal plates, because that is what glass
// actually does, and a regular subdivision of a sphere reads as a football the
// moment it comes apart.
//
// So the surface is carved by spherical Voronoi. A few hundred seed points are
// scattered over the sphere and every triangle joins whichever seed it is
// nearest to. Nearest ON A SPHERE is just the largest dot product, so the whole
// thing is one pass of dot products with no distances and no square roots. The
// cells that fall out of it are irregular convex plates with straight shared
// edges — which is exactly the shape a pane breaks into.

/** Radius in scene units, so 1.8 across. */
export const ORB_RADIUS = 0.9;

/** How many pieces it breaks into, and so how many butterflies come out. */
const SHARDS = 210;

/**
 * Icosahedral subdivision, not a UV sphere: even triangles all over, and no
 * pole where they crowd into slivers. Level 5 is 20480 faces, which is smooth
 * enough that the silhouette never shows a flat.
 */
const DETAIL = 5;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Cheap value noise for the seed jitter and the per-shard randoms. */
function hash(x: number, y: number, z: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** One piece of the broken sphere. */
export type OrbChunk = {
  /** centre of the piece, in the sphere's own space */
  centre: THREE.Vector3;
  /** stable per-piece random: tumble, speed, and when it turns */
  random: number;
};

/**
 * Builds the sphere with a per-face attribute saying which piece each triangle
 * belongs to, so the whole thing can fly apart in the vertex shader with no
 * per-frame CPU work at all.
 *
 * `seed` only moves the seed points, so the sphere is identical every time and
 * only the pattern it breaks into changes.
 */
export function createOrbGeometry(seed = 0): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(ORB_RADIUS, DETAIL);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  // A sphere's smooth normal at any point IS the direction from its centre, so
  // these are exact rather than averaged. PolyhedronGeometry hands back flat
  // per-face normals, which on glass shows every triangle.
  const normals = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    normals[i * 3] = x / len;
    normals[i * 3 + 1] = y / len;
    normals[i * 3 + 2] = z / len;
  }
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

  // ---- scatter the seed points ----
  // Fibonacci spiral, so they are evenly spread with no clumps and no bald
  // patches, then jittered so the cells are not a visible lattice.
  const sx = new Float32Array(SHARDS);
  const sy = new Float32Array(SHARDS);
  const sz = new Float32Array(SHARDS);
  for (let i = 0; i < SHARDS; i++) {
    const y = 1 - (i / (SHARDS - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    let px = Math.cos(theta) * r;
    let py = y;
    let pz = Math.sin(theta) * r;
    px += (hash(i + seed, 1.3, 4.7) - 0.5) * 0.18;
    py += (hash(i + seed, 9.1, 2.2) - 0.5) * 0.18;
    pz += (hash(i + seed, 5.5, 8.8) - 0.5) * 0.18;
    const len = Math.hypot(px, py, pz) || 1;
    sx[i] = px / len;
    sy[i] = py / len;
    sz[i] = pz / len;
  }

  // ---- assign every triangle to its nearest seed ----
  const faceCount = pos.count / 3;
  const faceShard = new Int32Array(faceCount);
  const sumX = new Float64Array(SHARDS);
  const sumY = new Float64Array(SHARDS);
  const sumZ = new Float64Array(SHARDS);
  const count = new Int32Array(SHARDS);

  for (let f = 0; f < faceCount; f++) {
    const i0 = f * 3;
    const cx = (pos.getX(i0) + pos.getX(i0 + 1) + pos.getX(i0 + 2)) / 3;
    const cy = (pos.getY(i0) + pos.getY(i0 + 1) + pos.getY(i0 + 2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i0 + 1) + pos.getZ(i0 + 2)) / 3;
    const len = Math.hypot(cx, cy, cz) || 1;
    const nx = cx / len;
    const ny = cy / len;
    const nz = cz / len;

    // Nearest point on a sphere is the largest dot product. No distances, no
    // square roots — which matters, because this runs SHARDS times per face.
    let best = -2;
    let bestI = 0;
    for (let s = 0; s < SHARDS; s++) {
      const d = nx * sx[s] + ny * sy[s] + nz * sz[s];
      if (d > best) {
        best = d;
        bestI = s;
      }
    }

    faceShard[f] = bestI;
    sumX[bestI] += cx;
    sumY[bestI] += cy;
    sumZ[bestI] += cz;
    count[bestI]++;
  }

  // ---- one centre and one random per piece ----
  const chunks: OrbChunk[] = [];
  const centreOf: THREE.Vector3[] = [];
  const randomOf: number[] = [];
  for (let s = 0; s < SHARDS; s++) {
    const n = Math.max(1, count[s]);
    const centre = new THREE.Vector3(sumX[s] / n, sumY[s] / n, sumZ[s] / n);
    const random = hash(centre.x + seed, centre.y + 3.1, centre.z + 7.9);
    centreOf.push(centre);
    randomOf.push(random);
    chunks.push({ centre, random });
  }

  const chunkCentres = new Float32Array(pos.count * 3);
  const chunkRandoms = new Float32Array(pos.count);
  for (let f = 0; f < faceCount; f++) {
    const s = faceShard[f];
    const c = centreOf[s];
    const r = randomOf[s];
    for (let j = 0; j < 3; j++) {
      const i = f * 3 + j;
      chunkCentres[i * 3] = c.x;
      chunkCentres[i * 3 + 1] = c.y;
      chunkCentres[i * 3 + 2] = c.z;
      chunkRandoms[i] = r;
    }
  }

  geo.setAttribute("aChunkCentre", new THREE.BufferAttribute(chunkCentres, 3));
  geo.setAttribute("aChunkRandom", new THREE.BufferAttribute(chunkRandoms, 1));
  geo.userData.chunks = chunks;
  return geo;
}
