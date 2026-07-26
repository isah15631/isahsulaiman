/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The floating "N" badge is Next's dev tools indicator. It never ships to
  // production, but it sits right on top of a piece that is meant to be
  // watched in the dark, so turn it off locally too.
  devIndicators: false,
  // three.js ships untranspiled ESM addons; let Next transpile them.
  transpilePackages: ["three"],
};

export default nextConfig;
