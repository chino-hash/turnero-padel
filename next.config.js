/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Configurar el directorio raíz del proyecto para evitar conflictos con múltiples lockfiles
  outputFileTracingRoot: path.join(__dirname),
  // Remover output: 'standalone' para Vercel - causa problemas de deployment
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Evitar que el build falle por ESLint en producción
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    
    // Resolver problemas con es-toolkit/compat usando lodash como fallback
    config.resolve.alias = {
      ...config.resolve.alias,
      'es-toolkit/compat/get': 'lodash/get',
      'es-toolkit/compat/sortBy': 'lodash/sortBy',
      'es-toolkit/compat/last': 'lodash/last',
      'es-toolkit/compat/throttle': 'lodash/throttle',
      'es-toolkit/compat/isEqual': 'lodash/isEqual',
      'es-toolkit/compat/range': 'lodash/range',
      'es-toolkit/compat/omit': 'lodash/omit',
      'es-toolkit/compat/maxBy': 'lodash/maxBy',
      'es-toolkit/compat/sumBy': 'lodash/sumBy',
      'es-toolkit/compat/minBy': 'lodash/minBy',
      'es-toolkit/compat/isPlainObject': 'lodash/isPlainObject',
      'es-toolkit/compat/uniqBy': 'lodash/uniqBy',
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