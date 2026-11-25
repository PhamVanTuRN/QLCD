import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    poweredByHeader: false,
    images: { unoptimized: true, dangerouslyAllowSVG: false, remotePatterns: [] },
    async rewrites() {
      // Production routes /api/v1 through the same-origin HTTPS ingress.
      return phase === PHASE_DEVELOPMENT_SERVER
        ? [{ source: "/api/v1/:path*", destination: "http://127.0.0.1:5023/api/v1/:path*" }]
        : [];
    },
    async headers() {
      return [{ source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ] }];
    }
  };
}
