# Diagramas de Arquitectura y Flujo

Esta carpeta contiene todos los diagramas de arquitectura del sistema de turnero de pádel, incluyendo diagramas de arquitectura general, flujos de usuario, estructura de base de datos y componentes del sistema.

## 📁 Contenido

- **[system-architecture.md](./system-architecture.md)** - Arquitectura general del sistema
- **[database-diagram.md](./database-diagram.md)** - Diagrama entidad-relación de la base de datos
- **[user-flows.md](./user-flows.md)** - Flujos de usuario principales
- **[component-architecture.md](./component-architecture.md)** - Arquitectura de componentes React
- **[api-architecture.md](./api-architecture.md)** - Arquitectura de APIs y endpoints
- **[deployment-diagram.md](./deployment-diagram.md)** - Diagrama de despliegue

## 🎯 Propósito

Estos diagramas proporcionan una visión clara de:

- **Arquitectura del Sistema**: Cómo interactúan los diferentes componentes
- **Flujos de Usuario**: Cómo los usuarios navegan por el sistema
- **Estructura de Datos**: Relaciones entre entidades de la base de datos
- **Componentes**: Jerarquía y dependencias de componentes React
- **APIs**: Estructura y flujo de datos en los endpoints
- **Despliegue**: Configuración de infraestructura y servicios

## 🛠️ Herramientas Utilizadas

- **Mermaid**: Para todos los diagramas (compatible con GitHub y documentación)
- **Diagramas de Flujo**: Para procesos y flujos de usuario
- **Diagramas de Clases**: Para arquitectura de componentes
- **Diagramas ER**: Para estructura de base de datos
- **Diagramas de Secuencia**: Para flujos de API

## 📖 Cómo Leer los Diagramas

### Convenciones de Color

- 🟦 **Azul**: Componentes de Frontend (React)
- 🟩 **Verde**: APIs y Backend
- 🟨 **Amarillo**: Base de Datos y Persistencia
- 🟪 **Morado**: Servicios Externos (NextAuth, OAuth)
- 🟥 **Rojo**: Procesos Críticos o de Seguridad

### Símbolos

- **→**: Flujo de datos o navegación
- **↔**: Comunicación bidireccional
- **⚡**: Procesos asíncronos
- **🔒**: Procesos que requieren autenticación
- **⚠️**: Puntos críticos o de validación

## 🔄 Mantenimiento

Estos diagramas deben actualizarse cuando:

- Se agreguen nuevos componentes o servicios
- Se modifique la estructura de la base de datos
- Se cambien flujos de usuario importantes
- Se actualice la arquitectura del sistema

## 📝 Contribución

Para actualizar o agregar diagramas:

1. Utilizar sintaxis de Mermaid
2. Seguir las convenciones de color establecidas
3. Incluir descripción y contexto
4. Validar que el diagrama se renderice correctamente
5. Actualizar este índice si es necesario

---

**Última actualización**: 2024-01-28  
**Versión**: 1.0  
**Herramientas**: Mermaid, Markdown