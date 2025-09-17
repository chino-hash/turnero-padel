import { NextRequest, NextResponse } from 'next/server'
import { env, isProduction, getAuthConfig, getDatabaseConfig } from '../../../lib/config/env'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (isProduction && authHeader !== 'Bearer debug-token-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authConfig = getAuthConfig()
  const dbConfig = getDatabaseConfig()

  return NextResponse.json({
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: authConfig.url,
    NEXTAUTH_SECRET: authConfig.secret ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_ID: authConfig.google.clientId ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: authConfig.google.clientSecret ? 'SET' : 'NOT SET',
    DATABASE_URL: dbConfig.url ? 'SET' : 'NOT SET',
    // Información parcial para debugging (sin exponer valores completos)
    GOOGLE_CLIENT_ID_PREVIEW: authConfig.google.clientId ?
      authConfig.google.clientId.substring(0, 20) + '...' : 'NOT SET',
    NEXTAUTH_URL_FULL: authConfig.url
  })
}