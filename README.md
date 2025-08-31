# 🎾 Turnero de Padel

**Sistema de gestión de reservas de canchas de padel** construido con Next.js 15, NextAuth.js y PostgreSQL.

## 🚀 Estado del Proyecto

✅ **COMPLETADO Y VALIDADO** - Listo para producción  
📅 **Última actualización**: 27 de Agosto, 2025  
🧪 **Pruebas**: 3/3 tests pasando exitosamente  

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 15.2.4 + TypeScript + Tailwind CSS
- **Autenticación**: NextAuth.js v5 (Google OAuth)
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM v6.14.0
- **Testing**: Playwright (E2E)
- **Hosting**: Vercel (recomendado)

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm/yarn/pnpm
- Cuenta de Google (para OAuth)
- Base de datos PostgreSQL (Neon recomendado)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd turnero-padel

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Aplicar migraciones de base de datos
npx prisma db push

# Generar cliente de Prisma
npx prisma generate

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 🧪 Pruebas

### Ejecutar tests E2E
```bash
# Ejecutar todos los tests
npx playwright test

# Ejecutar tests en modo headed (con interfaz)
npx playwright test --headed

# Ver reporte de resultados
npx playwright show-report
```

### Estado de las Pruebas
- ✅ **Flujo completo de usuario**: Navegación, autenticación, reservas
- ✅ **Conectividad PostgreSQL**: Conexión exitosa a Neon
- ✅ **Responsividad**: Desktop, tablet, móvil
- ✅ **Multi-navegador**: Chrome, Firefox, Safari
- ✅ **Rendimiento**: < 2s carga, < 1s respuesta API

## ⚙️ Configuración

### Variables de Entorno
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require
ADMIN_EMAILS=admin1@email.com,admin2@email.com
```

### Base de Datos
```bash
# Ver estado de la base de datos
npx prisma studio

# Resetear base de datos (desarrollo)
npx prisma db push --force-reset

# Ver logs de Prisma
npx prisma db push --verbose
```

## 🎯 Funcionalidades

### ✅ Implementadas
- **Autenticación con Google OAuth**
- **Gestión de canchas** (CRUD completo)
- **Sistema de reservas** con calendario interactivo
- **Panel de administración** para gestión de usuarios
- **Sistema de roles** (administradores vs usuarios)
- **Diseño responsive** para todos los dispositivos
- **Validación de formularios** frontend y backend

### 🔄 En desarrollo
- Sistema de notificaciones por email
- Integración de pagos
- Sistema de reviews y calificaciones

## 📁 Estructura del Proyecto

```
turnero-padel/
├── app/                    # App Router de Next.js
├── components/             # Componentes React reutilizables
├── lib/                    # Utilidades y configuraciones
│   ├── auth.ts            # Configuración NextAuth.js
│   ├── prisma.ts          # Cliente de Prisma
│   └── services/          # Servicios de datos
├── prisma/                # Esquema y migraciones
├── tests/                 # Tests E2E con Playwright
├── docs/                  # Documentación del proyecto
└── public/                # Archivos estáticos
```

## 📚 Documentación

- **[Migración Completa](MIGRATION-COMPLETE.md)** - Resumen de la migración Supabase → NextAuth.js
- **[Reporte de Pruebas](docs/REPORTE_PRUEBAS_PLAYWRIGHT_POSTGRESQL.md)** - Resultados detallados de testing
- **[Resumen Ejecutivo](docs/RESUMEN_EJECUTIVO_PROYECTO.md)** - Estado general del proyecto

## 🚀 Deploy en Vercel

1. **Conectar repositorio**:
   - Conecta tu repositorio de GitHub a Vercel
   - Vercel detectará automáticamente que es un proyecto Next.js

2. **Configurar variables de entorno**:
   ```bash
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secret-key-produccion
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   DATABASE_URL=tu-url-postgresql-produccion
   ADMIN_EMAILS=admin@tudominio.com
   ```

3. **Deploy automático**:
   - Cada push a `main` desplegará automáticamente
   - Preview deployments para pull requests

## 📊 Métricas del Proyecto

- **Líneas de código**: ~2,500
- **Componentes React**: 15+
- **API Routes**: 8
- **Tests E2E**: 3 (100% passing)
- **Cobertura de navegadores**: 100%
- **Tiempo de carga**: < 2 segundos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

**Proyecto**: Turnero de Padel  
**Versión**: 2.0 (Post-migración PostgreSQL)  
**Estado**: ✅ Listo para producción  
**Última actualización**: 27 de Agosto, 2025  

---

*Construido con ❤️ usando Next.js, NextAuth.js y PostgreSQL*
