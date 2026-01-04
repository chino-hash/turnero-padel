# ⚠️ SOLUCIÓN INMEDIATA: Error OAuth "invalid_client"

## 🔴 Problema Detectado

Los logs confirman que `GOOGLE_CLIENT_ID` está configurado como `"local-dev"` en tu archivo `.env.local`, lo cual NO es un Client ID válido de Google OAuth.

## ✅ Solución Rápida

### Opción 1: Si YA tienes credenciales de Google Cloud Console

Edita tu archivo `.env.local` y reemplaza la línea:

```bash
GOOGLE_CLIENT_ID=local-dev
```

Por:

```bash
GOOGLE_CLIENT_ID=tu-client-id-real-de-google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-real
```

Luego **reinicia el servidor** (`npm run dev`).

### Opción 2: Si NO tienes credenciales aún (temporal)

Si necesitas crear las credenciales primero, puedes comentar temporalmente la línea o usar un valor que cause un error más claro:

```bash
# GOOGLE_CLIENT_ID=local-dev
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

O simplemente elimina las líneas de `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` temporalmente.

**IMPORTANTE:** Después de cambiar `.env.local`, DEBES reiniciar el servidor de desarrollo.

## 📋 Para Crear Credenciales de Google OAuth

Sigue la guía completa en: `docs/SOLUCION_ERROR_OAUTH_LOCAL.md`

Resumen rápido:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea/selecciona un proyecto
3. Habilita Google+ API o Google Identity
4. Crea credenciales OAuth 2.0 (Aplicación web)
5. Agrega URI de redirección: `http://localhost:3000/api/auth/callback/google`
6. Copia el Client ID y Client Secret
7. Agrégalos a `.env.local`

## 🔍 Verificación

Después de corregir `.env.local` y reiniciar el servidor, puedes verificar en:
- `http://localhost:3000/api/debug-env` (debe mostrar "SET" para GOOGLE_CLIENT_ID)



