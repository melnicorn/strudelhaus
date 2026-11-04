import type { NextConfig } from "next";

// `npm run build:static` sets STATIC_EXPORT to write a plain static site to out/ (no Next server).
// trailingSlash makes each page a folder with index.html, which any static host serves as-is.
// Cache Components turns on PPR, which export mode refuses, so the static build leaves both flags off.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport && { output: "export", trailingSlash: true }),
};

export default nextConfig;
