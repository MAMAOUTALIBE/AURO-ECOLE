/** @type {import('next').NextConfig} */

// CSP APPLIQUÉE en production (plus de Report-Only). En développement on reste en
// Report-Only car Next/HMR exige 'unsafe-eval' et l'inline : enforcer casserait le
// rechargement à chaud. Suivi de durcissement : retirer 'unsafe-inline' via nonces.
const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' n'est jamais nécessaire au runtime en prod -> retiré (vecteur XSS).
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // 'self' couvre l'API (proxy même origine) et le websocket HMR en dev.
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : [])
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Aligné sur frame-ancestors 'none' (anti-clickjacking strict).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), browsing-topics=()" },
  {
    key: isProd ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: cspDirectives
  }
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
