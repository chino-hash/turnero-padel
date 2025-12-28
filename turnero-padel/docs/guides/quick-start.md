# Guía de Inicio Rápido

## 🚀 Configuración en 5 Minutos

Esta guía te ayudará a configurar el proyecto Turnero de Pádel en tu máquina local en menos de 5 minutos.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org/))
- **pnpm** ([Instalar](https://pnpm.io/installation))
- **Git** ([Descargar](https://git-scm.com/))
- **VS Code** (recomendado) ([Descargar](https://code.visualstudio.com/))

```bash
# Verificar versiones
node --version  # v18.0.0 o superior
pnpm --version  # 8.0.0 o superior
git --version   # 2.0.0 o superior
```

## ⚡ Configuración Rápida

### 1. Clonar el Repositorio

```bash
# Clonar el proyecto
git clone https://github.com/tu-usuario/turnero-padel.git
cd turnero-padel
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local
```

Edita el archivo `.env.local` con tus configuraciones:

```bash
# Base de datos (Supabase o local)
DATABASE_URL="postgresql://usuario:password@localhost:5432/turnero_padel"
DIRECT_URL="postgresql://usuario:password@localhost:5432/turnero_padel"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro-aqui"

# Google OAuth (opcional para desarrollo)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Supabase (si usas Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
```

### 4. Configurar Base de Datos

#### Opción A: Usar Supabase (Recomendado)

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Copia las credenciales a tu `.env.local`
3. Ejecuta las migraciones:

```bash
pnpm db:push
```

#### Opción B: PostgreSQL Local

```bash
# Instalar PostgreSQL localmente
# En macOS con Homebrew:
brew install postgresql
brew services start postgresql

# Crear base de datos
createdb turnero_padel

# Ejecutar migraciones
pnpm db:push
```

### 5. Iniciar el Servidor de Desarrollo

```bash
# Iniciar en modo desarrollo
pnpm dev
```

¡Listo! 🎉 Tu aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🔧 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Construir para producción
pnpm start            # Iniciar servidor de producción
pnpm lint             # Ejecutar linter
pnpm type-check       # Verificar tipos TypeScript

# Base de datos
pnpm db:push          # Aplicar cambios del schema a la DB
pnpm db:pull          # Sincronizar schema desde la DB
pnpm db:generate      # Generar cliente Prisma
pnpm db:studio        # Abrir Prisma Studio
pnpm db:seed          # Ejecutar seeds (datos de prueba)
pnpm db:reset         # Resetear base de datos

# Testing
pnpm test             # Ejecutar tests unitarios
pnpm test:watch       # Ejecutar tests en modo watch
pnpm test:e2e         # Ejecutar tests end-to-end
pnpm test:coverage    # Ejecutar tests con coverage

# Utilidades
pnpm format           # Formatear código con Prettier
pnpm clean            # Limpiar archivos generados
```

## 📁 Estructura del Proyecto

```
turnero-padel/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Rutas de administración
│   ├── (protected)/       # Rutas protegidas
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── auth/             # Componentes de autenticación
│   ├── booking/          # Componentes de reservas
│   └── admin/            # Componentes de administración
├── hooks/                # Custom React hooks
├── lib/                  # Utilidades y configuraciones
├── prisma/               # Schema y migraciones de Prisma
├── docs/                 # Documentación del proyecto
└── scripts/              # Scripts de utilidad
```

## 🎯 Primeros Pasos

### 1. Explorar la Aplicación

1. **Página de Inicio** - `http://localhost:3000`
2. **Login** - `http://localhost:3000/login`
3. **Dashboard** - `http://localhost:3000/dashboard` (requiere autenticación)
4. **Admin** - `http://localhost:3000/admin` (requiere rol admin)

### 2. Crear tu Primera Cuenta

```bash
# Ejecutar seeds para crear datos de prueba
pnpm db:seed
```

Esto creará:
- Usuario admin: `admin@turnero.com`
- Usuario regular: `user@turnero.com`
- Canchas de ejemplo
- Reservas de prueba

### 3. Hacer tu Primer Cambio

1. Abre `app/page.tsx`
2. Modifica el texto de bienvenida
3. Guarda el archivo
4. Ve los cambios en tiempo real en el navegador

## 🔍 Verificar que Todo Funciona

### Checklist de Verificación

- [ ] ✅ El servidor se inicia sin errores
- [ ] ✅ La página de inicio carga correctamente
- [ ] ✅ Puedes navegar entre páginas
- [ ] ✅ La base de datos está conectada
- [ ] ✅ Los estilos se cargan correctamente
- [ ] ✅ No hay errores en la consola del navegador

### Tests Rápidos

```bash
# Ejecutar tests básicos
pnpm test

# Verificar que el build funciona
pnpm build

# Verificar linting
pnpm lint
```

## 🚨 Solución de Problemas Comunes

### Error: "Module not found"

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Error de Base de Datos

```bash
# Resetear y regenerar la base de datos
pnpm db:reset
pnpm db:push
pnpm db:seed
```

### Error de Variables de Entorno

1. Verifica que `.env.local` existe
2. Asegúrate de que todas las variables requeridas están definidas
3. Reinicia el servidor de desarrollo

### Puerto 3000 en Uso

```bash
# Usar un puerto diferente
pnpm dev -- --port 3001
```

### Problemas con TypeScript

```bash
# Regenerar tipos de Prisma
pnpm db:generate

# Verificar tipos
pnpm type-check
```

## 🔧 Configuración de VS Code

### Extensiones Recomendadas

Instala estas extensiones para una mejor experiencia de desarrollo:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Configuración de Workspace

Crea `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 📚 Próximos Pasos

Ahora que tienes el proyecto funcionando:

1. **Lee la [Arquitectura del Proyecto](./project-architecture.md)** para entender la estructura
2. **Revisa la [Guía de Contribución](./contributing.md)** para aprender el flujo de trabajo
3. **Explora los [Patrones de Desarrollo](./development-patterns.md)** utilizados
4. **Consulta la [Documentación de APIs](../apis/README.md)** para entender los endpoints
5. **Revisa los [Diagramas de Arquitectura](../architecture/README.md)** para una visión general

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Revisa el [Troubleshooting](./troubleshooting.md)**
2. **Consulta las [FAQ](./faq.md)**
3. **Busca en [GitHub Issues](https://github.com/tu-usuario/turnero-padel/issues)**
4. **Crea un nuevo issue** si no encuentras la solución

---

**¡Felicidades! 🎉** Ya tienes el proyecto funcionando. ¡Hora de empezar a desarrollar!

**Tiempo estimado**: 5-10 minutos  
**Dificultad**: Principiante  
**Última actualización**: 2024-01-28