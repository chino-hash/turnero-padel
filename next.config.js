/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover output: 'standalone' para Vercel - causa problemas de deployment
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    forceSwcTransforms: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  // Configuración de trailing slash
  trailingSlash: false,
  
  // Headers de seguridad para iframe embedding
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
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.trae.ai https://trae.ai"
          }
        ]
      }
    ]
  },
  
  // Redirects para admin panel
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin-panel/admin',
        permanent: false
      }
    ]
  }
}

module.exports = nextConfig