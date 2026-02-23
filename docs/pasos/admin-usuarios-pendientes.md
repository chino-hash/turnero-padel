# Pendientes - Pestaña Usuarios

**Ruta:** `/admin-panel/admin/usuarios`  
**Archivo principal:** `app/admin-panel/admin/usuarios/page.tsx`  
**API:** `app/api/usuarios/analisis/route.ts`

---

## Estado actual

La pestaña Usuarios muestra un análisis de clientes: métricas, categorías VIP/Premium/Regular, tabla de usuarios frecuentes y programa de descuentos. Es mayormente de solo lectura.

---

## Implementado

- [x] Métricas (Total, Activos, Nuevos, Retención)
- [x] Clientes nuevos vs recurrentes
- [x] Valor promedio por cliente
- [x] Programa de descuentos (VIP, Premium, Regular)
- [x] Tabla de usuarios frecuentes (nombre, email, reservas, frecuencia, cancha preferida, categoría, descuento)
- [x] Botón actualizar datos

---

## Pendiente para dar por terminada

### 1. Gestión de usuarios

- CRUD o al menos edición de usuarios.
- Activar/desactivar usuarios.
- Cambiar rol (USER, ADMIN) si el admin tiene permisos.
- Ver y editar datos de contacto (teléfono, email).

### 2. Búsqueda y filtros

- Búsqueda por nombre o email.
- Filtro por categoría (VIP, Premium, Regular).
- Filtro por actividad (activos, inactivos, nuevos).

### 3. Paginación

- Paginación en la tabla de usuarios frecuentes.
- Ordenación por columnas (reservas, última reserva, etc.).

### 4. Detalle de usuario

- Página o modal de detalle de usuario.
- Historial de reservas del usuario.
- Datos completos de contacto.
- Resumen de pagos y deuda.

### 5. Aplicar/ajustar descuentos

- Posibilidad de asignar o modificar descuentos manualmente.
- O que los descuentos vengan de configuración/backend y no estén hardcodeados.

### 6. Configuración de categorías

- Los criterios VIP/Premium/Regular están fijos.
- Considerar configuración de umbrales (ej. reservas para cada categoría) desde el admin o sistema.

---

## Referencias

- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Roles: USER, ADMIN, Super Admin
- API análisis: `/api/usuarios/analisis`
