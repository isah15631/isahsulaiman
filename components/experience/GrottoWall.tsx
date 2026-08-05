"use client";

import { useEffect, useRef } from "react";

// The wall, reimagined as the thing the water ending earns: you followed the moon
// under, so the room is a grotto beneath the lake. The wall is wet living rock,
// and moonlight from the surface far above falls through the water and lays slow
// caustics across it — the wavering net of light you only ever see at the bottom
// of a pool. Your torch is the one warm light; where its pool falls the rock
// glows firelit, and the caustics near it warm from cold silver to gold.
//
// It is a single full-bleed fragment shader rather than the old masked SVG bricks,
// because caustics are motion and a still image cannot carry them. Before the
// torch is lit the grotto is already faintly there in cold moonlight; lighting the
// torch (lit -> 1) blooms the warm pool into it, so the ignition still pays off.

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLit;   // 0 unlit grotto, 1 torch throwing its warm pool
uniform vec2 uPool;   // torch pool centre, in 0..1 uv (y up)

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

// The net of light on the rock: the classic iterative water caustic, tuned to
// thin drifting veins rather than broad blobs. It wraps a scaled coordinate and
// folds it through a few trig passes so the crossings make wandering bright lines
// that braid and drift, the way caustics do at the bottom of a pool.
float caustic(vec2 uvIn, float t){
  vec2 uv = mod(uvIn * 6.2831853, 6.2831853) - 250.0;
  vec2 i = uv;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 4; n++){
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = uv + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(uv.x / (sin(i.x + tt) / inten),
                           uv.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;   // 0..1, y up
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Wet dark rock: a broad tone over a finer grain, kept cold and near-black so
  // the room reads as a grotto in the dark, not a lit surface.
  float n = fbm(p * 3.5);
  float n2 = fbm(p * 13.0 + 4.0);
  vec3 rock = mix(vec3(0.026, 0.032, 0.048), vec3(0.055, 0.066, 0.095), n);
  rock *= 0.8 + 0.4 * n2;

  // Moonlight comes from the surface above: faint, and fading toward the floor.
  float moon = 0.12 + 0.5 * smoothstep(-0.1, 1.0, uv.y);

  // Thin silver caustic veins drifting across the rock. Kept low so the wall is
  // atmosphere, not a light show, and the reading over it stays legible.
  float caust = caustic(p, uTime * 0.5) * moon;
  vec3 col = rock;
  col += vec3(0.45, 0.66, 1.0) * caust * 0.5;   // cold moonlight in the veins
  col += rock * caust * 0.5;                     // a wet sheen where they cross

  // The torch's warm pool, sat under the flame: tight and dim, a little there even
  // unlit (the embers), blooming as the torch catches.
  vec2 pc = vec2(uPool.x * aspect, uPool.y);
  float d = length(p - pc);
  float pool = exp(-d * d * 9.0);
  col += vec3(1.0, 0.5, 0.22) * pool * (0.08 + 0.85 * uLit);
  // warm the caustics that fall inside the pool from silver toward gold
  col = mix(col, col * vec3(1.3, 1.0, 0.7), pool * uLit * 0.7);

  // A firm vignette so the grotto keeps its dark and has depth.
  float vig = smoothstep(1.05, 0.2, length(uv - vec2(0.5, 0.42)));
  col *= 0.36 + 0.64 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    // Surfaces during dev; the wall just stays black if it fails.
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function GrottoWall({ lit = false }: { lit?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read the latest lit without re-running the GL setup effect.
  const litRef = useRef(lit);
  litRef.current = lit;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // One big triangle covering the clip space.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uLit = gl.getUniformLocation(prog, "uLit");
    const uPool = gl.getUniformLocation(prog, "uPool");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    let raf = 0;
    let litNow = litRef.current ? 1 : 0;
    const start = performance.now();
    const frame = (t: number) => {
      resize();
      const time = (t - start) / 1000;
      // ease the warm pool up (or down) so the ignition blooms in
      const target = litRef.current ? 1 : 0;
      litNow += (target - litNow) * 0.05;

      // sit the pool under the actual flame if the torch has marked it
      let px = 0.5;
      let py = 0.86;
      const flame = document.querySelector("[data-torch-flame]");
      if (flame) {
        const r = canvas.getBoundingClientRect();
        const fr = flame.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          px = (fr.left + fr.width / 2 - r.left) / r.width;
          py = 1 - (fr.top + fr.height / 2 - r.top) / r.height;
        }
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uLit, litNow);
      gl.uniform2f(uPool, px, py);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
