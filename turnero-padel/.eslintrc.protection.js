/**
 * Configuración ESLint para protección de archivos críticos
 * Este archivo define reglas específicas para prevenir modificaciones no autorizadas
 */

module.exports = {
  overrides: [
    {
      // Archivos protegidos del frontend público
      files: [
        'components/TurneroApp.tsx',
        'components/MisTurnos.tsx',
        'app/(protected)/dashboard/page.tsx',
        'app/(protected)/layout.tsx',
        'components/ui/**/*.tsx',
        'hooks/useAuth.ts',
        'lib/auth.ts',
        'middleware.ts'
      ],
      rules: {
        // Regla personalizada para advertir sobre modificaciones en archivos protegidos
        'no-console': 'error',
        'prefer-const': 'error',
        // Agregar más reglas específicas según necesidades
      },
      env: {
        browser: true,
        es2021: true
      }
    },
    {
      // Archivos de administración (modificaciones permitidas)
      files: [
        'app/(admin)/**/*.tsx',
        'components/Admin*.tsx',
        'components/admin/**/*.tsx'
      ],
      rules: {
        // Reglas más flexibles para archivos de administración
        'no-console': 'warn',
        'prefer-const': 'warn'
      }
    }
  ],
  
  // Plugin personalizado para validar comentarios de protección
  plugins: ['protection-validator'],
  
  rules: {
    // Regla que verifica la presencia de comentarios de protección
    'protection-validator/require-protection-header': [
      'error',
      {
        protectedFiles: [
          'components/TurneroApp.tsx',
          'components/MisTurnos.tsx',
          'app/(protected)/dashboard/page.tsx'
        ],
        requiredHeader: '⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN'
      }
    ]
  }
};