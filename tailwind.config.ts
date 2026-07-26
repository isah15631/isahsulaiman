import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The palette of the awakening. Deliberately warm, never neon.
        ember: "#ff6b3d",
        gold: "#f2b544",
        crimson: "#c9304a",
        emerald: "#2fa980",
        cyan: "#4fd1e0",
        violet: "#8b6bd1",
      },
      fontFamily: {
        // Elegant serif for the whispered words; sans for UI chrome only.
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 2s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
