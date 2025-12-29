# Arquitectura General del Sistema

## Descripción

Este diagrama muestra la arquitectura general del sistema de turnero de pádel, incluyendo la separación entre frontend, backend, base de datos y servicios externos.

## Diagrama de Arquitectura

```mermaid
graph TB
    %% Frontend Layer
    subgraph "🖥️ Frontend (Next.js 15)"
        UI["🎨 Componentes UI<br/>shadcn/ui + Tailwind"]
        Pages["📄 Páginas<br/>App Router"]
        Hooks["🪝 Custom Hooks<br/>useAuth, useBookings"]
        State["📊 Estado Global<br/>React Context"]
    end
    
    %% API Layer
    subgraph "🔌 API Layer (Next.js API Routes)"
        AuthAPI["🔐 /api/auth<br/>NextAuth.js"]
        BookingAPI["📅 /api/bookings<br/>CRUD Reservas"]
        CourtAPI["🏟️ /api/courts<br/>Gestión Canchas"]
        SlotAPI["⏰ /api/slots<br/>Horarios Disponibles"]
    end
    
    %% Business Logic Layer
    subgraph "🧠 Lógica de Negocio"
        AdminSys["👑 AdminSystem<br/>Gestión Permisos"]
        BookingSvc["📋 BookingService<br/>Lógica Reservas"]
        AuthSvc["🔑 AuthService<br/>Autenticación"]
        PricingSvc["💰 PricingService<br/>Cálculo Precios"]
    end
    
    %% Data Layer
    subgraph "💾 Capa de Datos"
        Prisma["🔗 Prisma ORM<br/>Query Builder"]
        Cache["⚡ Cache<br/>Memoria/Redis"]
    end
    
    %% Database
    subgraph "🗄️ Base de Datos"
        PostgreSQL[("🐘 PostgreSQL<br/>Datos Principales")]
        Tables["📊 Tablas:<br/>• Users & Auth<br/>• Bookings<br/>• Courts<br/>• Payments<br/>• Settings"]
    end
    
    %% External Services
    subgraph "🌐 Servicios Externos"
        GoogleOAuth["🔍 Google OAuth<br/>Autenticación"]
        EmailSvc["📧 Email Service<br/>Notificaciones"]
        PaymentGW["💳 Payment Gateway<br/>Procesamiento Pagos"]
    end
    
    %% Infrastructure
    subgraph "🏗️ Infraestructura"
        Docker["🐳 Docker<br/>Contenedores"]
        Vercel["▲ Vercel<br/>Deployment"]
        Monitoring["📊 Monitoring<br/>Logs & Métricas"]
    end
    
    %% Connections
    UI --> Pages
    Pages --> Hooks
    Hooks --> State
    
    Pages --> AuthAPI
    Pages --> BookingAPI
    Pages --> CourtAPI
    Pages --> SlotAPI
    
    AuthAPI --> AuthSvc
    BookingAPI --> BookingSvc
    CourtAPI --> AdminSys
    SlotAPI --> PricingSvc
    
    AuthSvc --> Prisma
    BookingSvc --> Prisma
    AdminSys --> Prisma
    PricingSvc --> Prisma
    
    Prisma --> Cache
    Prisma --> PostgreSQL
    PostgreSQL --> Tables
    
    AuthAPI --> GoogleOAuth
    BookingSvc --> EmailSvc
    BookingSvc --> PaymentGW
    
    PostgreSQL --> Docker
    Pages --> Vercel
    AuthAPI --> Monitoring
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef api fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef business fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef database fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef infra fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    
    class UI,Pages,Hooks,State frontend
    class AuthAPI,BookingAPI,CourtAPI,SlotAPI api
    class AdminSys,BookingSvc,AuthSvc,PricingSvc business
    class Prisma,Cache data
    class PostgreSQL,Tables database
    class GoogleOAuth,EmailSvc,PaymentGW external
    class Docker,Vercel,Monitoring infra
```

## Componentes Principales

### 🖥️ Frontend (Next.js 15)

- **Componentes UI**: Interfaz de usuario construida con shadcn/ui y Tailwind CSS
- **Páginas**: Rutas y páginas usando App Router de Next.js 15
- **Custom Hooks**: Lógica reutilizable encapsulada (useAuth, useBookings, etc.)
- **Estado Global**: Gestión de estado con React Context API

### 🔌 API Layer

- **NextAuth.js**: Manejo completo de autenticación con Google OAuth
- **API Routes**: Endpoints RESTful para todas las operaciones CRUD
- **Middleware**: Protección de rutas y validación de permisos

### 🧠 Lógica de Negocio

- **AdminSystem**: Gestión flexible de administradores (env + DB)
- **BookingService**: Lógica compleja de reservas y validaciones
- **AuthService**: Servicios de autenticación y autorización
- **PricingService**: Cálculo dinámico de precios y descuentos

### 💾 Capa de Datos

- **Prisma ORM**: Abstracción de base de datos con type safety
- **Cache**: Sistema de cache para optimizar consultas frecuentes
- **Migraciones**: Control de versiones de esquema de DB

### 🗄️ Base de Datos

- **PostgreSQL**: Base de datos principal con soporte completo ACID
- **Esquema Normalizado**: Tablas optimizadas para rendimiento
- **Índices**: Optimización de consultas frecuentes

## Flujo de Datos

### 1. Autenticación
```
Usuario → Google OAuth → NextAuth → JWT → Session → Frontend
```

### 2. Reserva de Cancha
```
Formulario → Validación → API → BookingService → Prisma → PostgreSQL
```

### 3. Consulta de Disponibilidad
```
Filtros → SlotAPI → Cache Check → PricingService → Respuesta JSON
```

## Patrones Arquitectónicos

### 🏗️ Patrones Utilizados

- **Layered Architecture**: Separación clara de responsabilidades
- **Repository Pattern**: Abstracción de acceso a datos con Prisma
- **Service Layer**: Lógica de negocio encapsulada
- **API-First Design**: APIs bien definidas y documentadas
- **Component-Based**: Componentes React reutilizables

### 🔒 Seguridad

- **JWT Tokens**: Autenticación stateless segura
- **RBAC**: Control de acceso basado en roles (USER/ADMIN)
- **Input Validation**: Validación en frontend y backend
- **HTTPS Only**: Comunicación encriptada
- **CSRF Protection**: Protección contra ataques CSRF

### ⚡ Performance

- **Server-Side Rendering**: SSR con Next.js para SEO
- **Static Generation**: Páginas estáticas cuando es posible
- **Database Indexing**: Índices optimizados en PostgreSQL
- **Caching Strategy**: Cache en múltiples niveles
- **Code Splitting**: Carga lazy de componentes

## Escalabilidad

### 📈 Consideraciones de Escala

- **Horizontal Scaling**: Múltiples instancias de la aplicación
- **Database Sharding**: Particionamiento de datos por región/cancha
- **CDN Integration**: Distribución de assets estáticos
- **Microservices Ready**: Arquitectura preparada para división

### 🔄 Mejoras Futuras

- **Redis Cache**: Cache distribuido para múltiples instancias
- **Message Queue**: Procesamiento asíncrono de notificaciones
- **Real-time Updates**: WebSockets para actualizaciones en tiempo real
- **API Gateway**: Centralización de APIs y rate limiting
- **Monitoring**: APM y observabilidad completa

---

**Tecnologías Principales**:
- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes, Prisma ORM, NextAuth.js
- Base de Datos: PostgreSQL
- Testing: Jest, Playwright, Cypress, Testing Library
- Infraestructura: Docker, Vercel

**Última actualización**: 2024-12-28  
**Versión**: 2.0