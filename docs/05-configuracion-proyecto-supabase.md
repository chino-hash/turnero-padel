# Configuración del Proyecto Supabase - Turnero de Padel

## Resumen Ejecutivo

Este documento te guía paso a paso para configurar completamente tu proyecto Supabase con la base de datos, autenticación y storage necesarios para el turnero de padel.

## 1. Configuración Inicial

### Obtener Credenciales del Proyecto
Desde tu dashboard de Supabase (https://supabase.com/dashboard/project/nfxvzoaxqcwpwfpgrqxq):

1. **Ve a Settings → API**
2. Copia los siguientes valores:
   - **Project URL**: `https://nfxvzoaxqcwpwfpgrqxq.supabase.co`
   - **anon public key**: Clave pública para el cliente
   - **service_role key**: Clave privada para operaciones de servidor

### Configurar Variables de Entorno
Actualiza el archivo `.env.local` con tus credenciales reales:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nfxvzoaxqcwpwfpgrqxq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXTAUTH_SECRET=un-secret-muy-seguro-y-aleatorio-aqui
NEXTAUTH_URL=http://localhost:3000
```

## 2. Ejecutar Schema de Base de Datos

### Paso 1: Crear las Tablas
1. **Ve a SQL Editor** en tu dashboard de Supabase
2. **Crea una nueva query**
3. **Copia y pega** el contenido completo de `supabase/schema.sql`
4. **Ejecuta la query** (botón "Run")

Esto creará:
- ✅ 6 tablas principales (profiles, courts, bookings, etc.)
- ✅ Índices para optimización
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de seguridad
- ✅ Triggers automáticos
- ✅ Funciones de utilidad

### Paso 2: Insertar Datos Iniciales
1. **Crea otra nueva query**
2. **Copia y pega** el contenido de `supabase/seed.sql`
3. **Ejecuta la query**

Esto insertará:
- ✅ 3 canchas de padel por defecto
- ✅ Configuraciones del sistema
- ✅ Bucket de storage para avatares
- ✅ Políticas de storage

## 3. Configurar Autenticación

### Configurar Providers de Auth
1. **Ve a Authentication → Settings**
2. **En "Auth Providers"**, asegúrate que esté habilitado:
   - ✅ **Email**: Habilitado
   - ✅ **Confirm email**: Habilitado (recomendado)
   - ✅ **Enable email confirmations**: Habilitado

### Configurar URLs de Redirección
1. **En "URL Configuration"**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: 
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/login
     ```

### Configurar Email Templates (Opcional)
1. **Ve a Authentication → Email Templates**
2. **Personaliza los templates** según tu marca:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

## 4. Configurar Storage

### Verificar Bucket de Avatares
1. **Ve a Storage**
2. **Verifica que existe** el bucket `avatars`
3. **Si no existe**, créalo:
   - Name: `avatars`
   - Public: ✅ Habilitado
   - File size limit: 1MB
   - Allowed MIME types: `image/*`

## 5. Configurar Realtime

### Habilitar Realtime para Tablas
1. **Ve a Database → Replication**
2. **Verifica que estén habilitadas**:
   - ✅ `public.bookings`
   - ✅ `public.booking_players`
   - ✅ `public.payments`

Si no están habilitadas:
1. **Clic en "Add table"**
2. **Selecciona las tablas** mencionadas
3. **Habilita replicación**

## 6. Crear Usuario Administrador

### Método 1: Desde el Dashboard
1. **Ve a Authentication → Users**
2. **Clic en "Add user"**
3. **Completa los datos**:
   - Email: `admin@padelclub.com`
   - Password: `Admin123!`
   - Email Confirm: ✅ Habilitado

### Método 2: Desde SQL Editor
```sql
-- Primero registra el usuario normalmente desde la app
-- Luego ejecuta esto para hacerlo admin:
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@padelclub.com'
);
```

## 7. Verificar Configuración

### Test de Conexión
Ejecuta en SQL Editor:
```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar canchas insertadas
SELECT * FROM public.courts;

-- Verificar configuraciones
SELECT * FROM public.system_settings;
```

### Test de RLS
```sql
-- Esto debería fallar (sin autenticación)
SELECT * FROM public.profiles;

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 8. Configurar Edge Functions (Opcional)

### Instalar Supabase CLI
```bash
npm install -g supabase
```

### Inicializar proyecto local
```bash
supabase init
supabase login
supabase link --project-ref nfxvzoaxqcwpwfpgrqxq
```

### Desplegar funciones
```bash
supabase functions deploy process-payment
supabase functions deploy generate-report
```

## 9. Testing de la Configuración

### Probar Autenticación
1. **Ejecuta la app**: `npm run dev`
2. **Ve a**: `http://localhost:3000/login`
3. **Registra un usuario** de prueba
4. **Verifica** que se cree el perfil automáticamente

### Probar APIs
```typescript
// Test básico en el navegador (consola)
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://nfxvzoaxqcwpwfpgrqxq.supabase.co',
  'tu-anon-key'
)

// Test de lectura de canchas
supabase.from('courts').select('*').then(console.log)
```

## 10. Monitoreo y Logs

### Configurar Logs
1. **Ve a Logs → Explorer**
2. **Configura alertas** para:
   - Errores de autenticación
   - Fallos de RLS
   - Errores de API

### Métricas Importantes
- **Database → Usage**: Uso de base de datos
- **Auth → Usage**: Usuarios activos
- **Storage → Usage**: Uso de almacenamiento
- **Edge Functions → Logs**: Logs de funciones

## 11. Seguridad y Backup

### Configurar Backup
1. **Ve a Settings → Database**
2. **Habilita backups automáticos**
3. **Configura retención**: 7 días mínimo

### Configurar Alertas
1. **Ve a Settings → Alerts**
2. **Configura alertas** para:
   - Uso excesivo de recursos
   - Errores de autenticación
   - Fallos de backup

## 12. Próximos Pasos

Una vez completada la configuración:

1. ✅ **Probar login/registro** en la aplicación
2. ✅ **Verificar creación de perfiles** automática
3. ✅ **Crear usuario administrador**
4. ✅ **Probar acceso a rutas protegidas**
5. 🔄 **Continuar con configuración de Redis**
6. 🔄 **Migrar datos mock a APIs reales**

## Troubleshooting Común

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctas
- Asegúrate de reiniciar el servidor de desarrollo

### Error: "Row Level Security"
- Verifica que las políticas RLS estén creadas
- Confirma que el usuario esté autenticado

### Error: "Table doesn't exist"
- Verifica que el schema.sql se ejecutó correctamente
- Revisa los logs en Database → Logs

### Error: "Storage bucket not found"
- Verifica que el bucket 'avatars' existe
- Confirma que las políticas de storage están creadas

¡Tu proyecto Supabase está listo para funcionar con el turnero de padel!
