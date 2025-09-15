import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo o con un token específico
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== 'Bearer debug-token-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    // Mostrar solo los primeros caracteres para debug
    GOOGLE_CLIENT_ID_PREVIEW: process.env.GOOGLE_CLIENT_ID ? 
      process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET',
    NEXTAUTH_URL_FULL: process.env.NEXTAUTH_URL
  }

  return NextResponse.json(envVars)
}