# Índice de Documentación - Proyecto Turnero de Pádel

## Análisis y Diseño Original

1. [Análisis del Frontend Actual](./01-analisis-frontend-actual.md)
2. [Diseño de Base de Datos Supabase](./02-diseno-base-datos-supabase.md)
3. [Configuración de Autenticación Supabase](./03-configuracion-autenticacion-supabase.md)
4. [Implementación de APIs Supabase](./04-implementacion-apis-supabase.md)
5. [Configuración del Proyecto Supabase](./05-configuracion-proyecto-supabase.md)

## Plan de Mejoras

6. [Migración de SQLite a PostgreSQL](./06-migracion-sqlite-postgresql.md)
7. [Mejora de la Documentación Interna](./07-mejora-documentacion-interna.md)
8. [Implementación de Pruebas Automatizadas](./08-implementacion-pruebas-automatizadas.md)

## Implementaciones Recientes

9. [Análisis de Mejoras UI Frontend](./09-analisis-frontend-mejoras-ui.md)
10. [Cambios Frontend - Parte 1](./10-frontend-cambios-1.markdown)
11. [Refactorización de Componentes - Resumen](./11-refactorizacion-componentes-resumen.md)

## Documentación Técnica Específica

- [Implementación de Horarios Reservados](./documentacion-implementacion-horarios-reservados.md)
- [Corrección de Posicionamiento - Sección Turnos](./documentacion-implementacion-posicionamiento-turnos.md)
- [Resumen de Cambios Técnicos](./resumen-cambios-tecnicos.md)
- [Especificación Mis Turnos](./mis-turnos-especificacion.md)
- [Especificación Panel de Inicio](./panel-inicio-especificacion.md)

## Documentación Administrativa

- [Funcionalidad Completa Admin Turnos](./admin-turnos-funcionalidad-completa.md)
- [Documentación Admin Canchas](./admin-canchas-documentacion.md)
- [Trabajo Botón Admin](./documentacion-trabajo-boton-admin.md)

## Guías de Configuración

- [Guía Completa Configuración Vercel](./GUIA_CONFIGURACION_VERCEL_COMPLETA.md)
- [Análisis Error 400 OAuth](./analisis-error-400-oauth.md)

## Estructura del Proyecto

El proyecto "Turnero de Pádel" es una aplicación web desarrollada con Next.js que permite la gestión de reservas de canchas de pádel. La aplicación incluye funcionalidades de autenticación, gestión de usuarios, reservas, pagos y administración.

### Tecnologías Principales

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Base de Datos**: SQLite (desarrollo), PostgreSQL (producción planificada)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js con Google OAuth

### Componentes Clave

- **Sistema de Autenticación**: Implementado con NextAuth.js y adaptador Prisma
- **Sistema de Administración**: Control de acceso basado en roles con lista blanca de administradores
- **Gestión de Reservas**: Funcionalidad para crear, ver y gestionar reservas de canchas
- **Gestión de Pagos**: Sistema para registrar y gestionar pagos de reservas

## Estado Actual y Próximos Pasos

El proyecto ha completado una migración exitosa desde Supabase a NextAuth.js + PostgreSQL + Prisma para la autenticación y gestión de datos. Los próximos pasos incluyen:

1. Migrar la base de datos de desarrollo (SQLite) a PostgreSQL para producción
2. Mejorar la documentación interna del código y APIs
3. Implementar pruebas automatizadas para asegurar la calidad del código

## Cómo Usar Esta Documentación

Esta documentación está organizada de forma secuencial, comenzando con el análisis y diseño original, seguido por los planes de mejora. Para nuevos desarrolladores, recomendamos:

1. Revisar primero el índice para obtener una visión general del proyecto
2. Leer los documentos de análisis y diseño para entender la arquitectura
3. Consultar los planes de mejora para comprender la dirección futura
4. Referirse a la documentación específica según la tarea a realizar

## Contribución a la Documentación

Para mantener esta documentación actualizada:

1. Actualizar los documentos existentes cuando se realicen cambios significativos
2. Añadir nuevos documentos siguiendo la numeración secuencial
3. Mantener el índice actualizado con los nuevos documentos
4. Seguir el formato Markdown para mantener la consistencia