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
  // Reducir el tamaño del middleware excluyendo dependencias pesadas
  outputFileTracingExcludes: {
    '*': [
      // Existentes
      'node_modules/@swc/core*/**',
      'node_modules/@esbuild/**',
      'node_modules/webpack/**',
      'node_modules/rollup/**',
      'node_modules/@prisma/client/runtime/wasm-engine-edge.js',
      // NO excluir @prisma/client aquí: las páginas y API routes sí lo necesitan.
      // Solo el middleware lo excluye (véase 'middleware' más abajo).
      'node_modules/terser/**',
      'node_modules/esbuild/**',
      'node_modules/@babel/**',
      'node_modules/ts-node/**',
      // Pruebas y desarrollo
      'node_modules/playwright/**',
      'node_modules/@playwright/**',
      'node_modules/jest/**',
      'node_modules/@jest/**',
      'node_modules/cypress/**',
      'node_modules/msw/**',
    ],
    // Exclusiones específicas para el Edge Function del middleware
    'middleware': [
      'node_modules/@prisma/client/**',
      'node_modules/@auth/prisma-adapter/**',
    ],
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