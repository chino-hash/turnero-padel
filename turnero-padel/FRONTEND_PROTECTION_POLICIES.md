# Políticas de Protección del Frontend

## 📋 Resumen Ejecutivo

Este documento establece las políticas y procedimientos para proteger los componentes críticos del frontend del sistema de turnos de pádel, asegurando que las modificaciones no autorizadas no afecten la experiencia del usuario final.

## 🛡️ Archivos y Componentes Protegidos

### Componentes de Usuario Final (🚫 PROHIBIDO MODIFICAR)

#### Componentes Principales
- `components/TurneroApp.tsx` - Aplicación principal del turnero
- `components/MisTurnos.tsx` - Vista de turnos del usuario
- `app/(protected)/dashboard/page.tsx` - Dashboard de usuario
- `app/(protected)/layout.tsx` - Layout de páginas protegidas

#### Componentes de UI Base
- `components/ui/button.tsx` - Componente de botones
- `components/ui/card.tsx` - Componente de tarjetas
- `components/ui/input.tsx` - Componente de inputs
- `components/ui/dialog.tsx` - Componente de diálogos
- `components/ui/label.tsx` - Componente de etiquetas

#### Autenticación y Seguridad
- `hooks/useAuth.ts` - Hook de autenticación
- `lib/auth.ts` - Lógica de autenticación
- `middleware.ts` - Middleware de Next.js
- `app/api/auth/**/*` - APIs de autenticación

## ✅ Archivos Permitidos para Modificación

### Componentes de Administración
- `app/(admin)/**/*.tsx` - Todas las páginas de administración
- `components/Admin*.tsx` - Componentes administrativos
- `components/admin/**/*.tsx` - Componentes del panel de administración

### APIs Administrativas
- `app/api/admin/**/*.ts` - APIs del panel de administración
- `lib/admin/**/*.ts` - Utilidades administrativas

### Configuración y Build
- `next.config.js` - Configuración de Next.js
- `tailwind.config.js` - Configuración de Tailwind
- `package.json` - Dependencias del proyecto

## 📝 Reglas de Modificación

### Para Archivos Protegidos
1. **Prohibición General**: No se permite ninguna modificación sin autorización explícita
2. **Proceso de Autorización**:
   - Solicitud formal documentada
   - Revisión por el equipo técnico
   - Aprobación del responsable del proyecto
   - Documentación completa de cambios
3. **Excepciones de Emergencia**: Solo para bugs críticos que afecten la funcionalidad

### Para Archivos Administrativos
1. **Modificaciones Libres**: Se permiten cambios según necesidades del negocio
2. **Buenas Prácticas**: Seguir estándares de código y documentación
3. **Testing**: Verificar que no afecten el frontend público

## 🔧 Identificación Visual en el Código

### Headers de Protección

#### Archivos Protegidos
```typescript
/**
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * 
 * Este archivo contiene funcionalidad crítica para usuarios finales.
 * Cualquier modificación debe ser:
 * 1. Solicitada formalmente
 * 2. Revisada por el equipo
 * 3. Aprobada explícitamente
 * 4. Documentada completamente
 * 
 * Contacto para modificaciones: Responsable del proyecto
 * Última revisión: 2024-12-19
 */
```

#### Archivos Administrativos
```typescript
/**
 * ✅ ÁREA DE ADMINISTRACIÓN - MODIFICACIONES PERMITIDAS
 * 
 * Este archivo es parte del panel de administración y puede ser modificado
 * según las necesidades del negocio. Cambios permitidos incluyen:
 * - Nuevas funcionalidades administrativas
 * - Mejoras en la interfaz de administración
 * - Integración de nuevos módulos de gestión
 * - Optimizaciones de rendimiento
 * 
 * Última actualización: 2024-12-19
 */
```

## 🛠️ Herramientas de Protección

### Git Hooks
- **Pre-commit** (`.githooks/pre-commit`): Valida modificaciones antes del commit
  - Detecta cambios en archivos protegidos
  - Verifica presencia de headers de protección
  - Solicita confirmación para cambios críticos
  - Permite override con `FRONTEND_PROTECTION_OVERRIDE=true`

### Configuración ESLint
- **Archivo**: `.eslintrc.protection.js`
- Reglas específicas para archivos protegidos vs. administrativos
- Validación automática de headers de protección
- Integración con CI/CD

### Scripts de Verificación
- **Setup**: `scripts/setup-protection.ps1`
  - Instala Git Hooks automáticamente
  - Configura scripts npm
  - Crea archivos de configuración
  
- **Verificación**: `scripts/check-protection.js`
  - Valida integridad de archivos protegidos
  - Genera reportes detallados
  - Verifica cambios recientes
  - Calcula nivel de protección

- **Scripts NPM disponibles**:
  - `npm run lint:protection` - Ejecuta linting de protección
  - `npm run check:protection` - Verifica archivos protegidos
  - `npm run setup:protection` - Configura herramientas de protección

### Instalación de Herramientas
```powershell
# Ejecutar desde la raíz del proyecto
.\scripts\setup-protection.ps1
```

### Uso Diario
```bash
# Verificar estado de protección
npm run check:protection

# Validar antes de commit
npm run lint:protection

# Override temporal para archivos protegidos
$env:FRONTEND_PROTECTION_OVERRIDE='true'
git commit -m "Cambio autorizado en archivo protegido"
```

## 📊 Monitoreo y Reportes

### Verificación Automática
- Ejecución diaria del script de verificación
- Reportes automáticos de cambios en archivos protegidos
- Alertas por email para modificaciones no autorizadas

### Métricas de Protección
- Porcentaje de archivos protegidos con headers correctos
- Número de intentos de modificación bloqueados
- Tiempo promedio de respuesta a solicitudes de cambio

## 🚨 Procedimiento de Emergencia

### Para Bugs Críticos
1. **Identificación**: Documentar el problema crítico
2. **Evaluación**: Confirmar que afecta usuarios finales
3. **Autorización Temporal**: Usar override con documentación
4. **Implementación**: Realizar cambio mínimo necesario
5. **Revisión Post-Implementación**: Validar y documentar cambios

### Comando de Override
```powershell
# Windows PowerShell
$env:FRONTEND_PROTECTION_OVERRIDE='true'
git commit -m "EMERGENCIA: Fix crítico - [descripción]"

# Bash/Linux
FRONTEND_PROTECTION_OVERRIDE=true git commit -m "EMERGENCIA: Fix crítico - [descripción]"
```

## 📞 Contactos y Responsabilidades

### Responsable del Proyecto
- **Función**: Aprobación final de cambios en archivos protegidos
- **Contacto**: [Definir contacto]

### Equipo Técnico
- **Función**: Revisión técnica y implementación
- **Contacto**: [Definir contacto]

### Administrador de Sistema
- **Función**: Configuración y mantenimiento de herramientas
- **Contacto**: [Definir contacto]

## 📅 Revisión y Actualización

- **Frecuencia**: Revisión mensual de políticas
- **Actualización**: Según cambios en la arquitectura
- **Documentación**: Mantener historial de cambios

---

**Última actualización**: 2024-12-19  
**Versión**: 1.0  
**Estado**: Activo