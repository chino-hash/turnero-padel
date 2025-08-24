import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Node.js runtime for API routes to support Prisma
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Configure headers to allow iframe embedding
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.trae.ai https://trae.ai"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
