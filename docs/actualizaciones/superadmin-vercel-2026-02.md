# Solución: Rol Super Admin en Vercel (Producción)

**Fecha:** Febrero 2026  
**Problema:** El rol de super admin funcionaba en local pero no en producción (Vercel).

---

## Contexto del problema

- Variable `SUPER_ADMIN_EMAILS` configurada correctamente en Vercel.
- El usuario podía acceder al panel admin (`/admin-panel`) pero no al panel de super admin (`/super-admin`).
- Acceso a `/super-admin` devolvía error `AccessDenied`.

---

## Causa raíz

El rol de usuario se guarda en el **JWT** en el momento del login. Aunque la variable de entorno estaba bien configurada:

1. Las variables de entorno en Vercel **solo se aplican tras un nuevo deploy**.
2. El JWT existente seguía con el rol anterior; no se actualiza hasta un nuevo login.

---

## Cambios realizados

### 1. Endpoint de diagnóstico `/api/debug-env`

**Propósito:** Verificar en producción si `SUPER_ADMIN_EMAILS` está definida y se lee correctamente.

**Implementación:**
- Se añadieron los campos `SUPER_ADMIN_EMAILS_count` y `SUPER_ADMIN_EMAILS_configured` al response (sin exponer emails).
- Soporte de autenticación por:
  - Header: `Authorization: Bearer debug-token-2024`
  - Query param: `?token=debug-token-2024`

**Uso (con sesión iniciada):**
```
GET https://padelbook.com.ar/api/debug-env?token=debug-token-2024
```

**Restricción de seguridad:** El endpoint **no** está en rutas API públicas. Solo se puede llamar con sesión activa y token válido.

---

### 2. Configuración de `SUPER_ADMIN_EMAILS` en Vercel

**Pasos:**

1. Vercel → Proyecto → **Settings** → **Environment Variables**
2. Crear variable:
   - **Name:** `SUPER_ADMIN_EMAILS`
   - **Value:** `email1@gmail.com,email2@empresa.com` (emails separados por coma)
   - **Environments:** Production (y Preview si corresponde)
3. Guardar y hacer **Redeploy** del proyecto.

---

### 3. Pasos para que el rol se aplique

Después de configurar o modificar la variable:

1. **Redeploy** del proyecto en Vercel.
2. **Cerrar sesión** por completo en la app.
3. **Borrar cookies** de padelbook.com.ar (o usar ventana de incógnito).
4. **Volver a iniciar sesión** con uno de los emails configurados.

El JWT se genera en el login; un nuevo login es necesario para que el rol de super admin se guarde en el token.

---

## Verificación

- **Panel Super Admin:** `https://padelbook.com.ar/super-admin`
- Si el rol está bien asignado, se accede al panel sin redirección.
- Si no, se redirige a `/auth/error?error=AccessDenied`.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/api/debug-env/route.ts` | Campos de `SUPER_ADMIN_EMAILS`, soporte de token por query param |
| `middleware.ts` | No se incluye `/api/debug-env` en rutas públicas (requiere sesión + token) |

---

## Referencias

- [Arquitectura Multitenant](../MULTITENANT_COMPLETE.md) — Configuración de super admins
- [Guía Configuración Vercel](../GUIA_CONFIGURACION_VERCEL_COMPLETA.md) — Variables de entorno
