\# Plan de Acción: Refactorización y Dinamización Completa

Este documento detalla el plan de trabajo para eliminar los datos hardcodeados del frontend, conectar la UI con el backend dinámico y unificar las definiciones de datos en todo el proyecto.

\---

\#\# ✅ Paso 1: Unificar el Modelo de Datos (Consistencia de Tipos)

\*\*Objetivo:\*\* Alinear las interfaces de TypeScript con el esquema de Prisma. Esto garantiza la seguridad de tipos, mejora el autocompletado y previene errores de inconsistencia entre el cliente y el servidor.

\#\#\# Archivos a Modificar  
\- \`types/types.ts\`

\#\#\# Tareas  
1\.  \*\*Corregir Nombres de Propiedades:\*\* En la interfaz o tipo \`Court\`, renombra la propiedad \`base\_price\` para que coincida con el camelCase del esquema de Prisma.  
    \-   \*\*Cambiar de:\*\* \`base\_price?: number\`  
    \-   \*\*Cambiar a:\*\* \`basePrice: number\`

2\.  \*\*Definir Tipos para JSON:\*\* Refina los tipos de las propiedades que almacenan JSON (\`features\` y \`operatingHours\`) para que no sean simples \`string\`. Crea interfaces específicas para ellos.

    \`\`\`typescript  
    // Dentro de types/types.ts

    // Interfaz para el JSON de operatingHours  
    export interface OperatingHours {  
      start: string;  
      end: string;  
      slot\_duration: number;  
    }

    // Interfaz para el JSON de features  
    export interface CourtFeatures {  
      color: string;  
      bgColor: string;  
      textColor: string;  
    }

    // Actualiza la interfaz principal Court  
    export interface Court {  
      id: string;  
      name: string;  
      description: string | null;  
      basePrice: number;  
      priceMultiplier: number;  
      isActive: boolean;  
      // Usa las nuevas interfaces en lugar de 'string'  
      operatingHours: OperatingHours;   
      features: CourtFeatures;  
    }  
    \`\`\`  
    \*Nota: Asegúrate de que los componentes que usan el tipo \`Court\` se actualicen para parsear el JSON y que el resultado coincida con estas nuevas interfaces.\*

\---

\#\# ✅ Paso 2: Integrar \`SystemSetting\` en la API como Fallback

\*\*Objetivo:\*\* Eliminar las constantes hardcodeadas en la ruta \`/api/slots\` y, en su lugar, utilizar la tabla \`SystemSetting\` de la base de datos como fuente de verdad para los valores por defecto.

\#\#\# Archivos a Modificar  
\- \`lib/services/system-settings.ts\` (\*\*Archivo Nuevo\*\*)  
\- \`app/api/slots/route.ts\`

\#\#\# Tareas  
1\.  \*\*Crear un Servicio de Configuración:\*\*  
    \-   Crea el archivo \`lib/services/system-settings.ts\`.  
    \-   Implementa funciones \`async\` para obtener valores específicos de la tabla \`SystemSetting\`. Estas funciones deben incluir caché para minimizar las consultas a la base de datos.

    \`\`\`typescript  
    // En lib/services/system-settings.ts  
    import { PrismaClient } from '@prisma/client';  
    import { unstable\_cache as cache } from 'next/cache';

    const prisma \= new PrismaClient();

    // Ejemplo de una función cacheada para obtener el horario por defecto  
    export const getDefaultOperatingHours \= cache(  
      async () \=\> {  
        const startSetting \= await prisma.systemSetting.findUnique({ where: { key: 'operating\_hours\_start' } });  
        const endSetting \= await prisma.systemSetting.findUnique({ where: { key: 'operating\_hours\_end' } });  
        const durationSetting \= await prisma.systemSetting.findUnique({ where: { key: 'default\_slot\_duration' } });

        // Retorna un objeto con valores por defecto si no se encuentran en la BD  
        return {  
          start: startSetting?.value || '08:00',  
          end: endSetting?.value || '23:00',  
          slot\_duration: durationSetting ? parseInt(durationSetting.value, 10\) : 90,  
        };  
      },  
      \['system-settings', 'default-operating-hours'\], // Clave de caché  
      { revalidate: 3600 } // Revalidar cada hora  
    );  
    \`\`\`

2\.  \*\*Actualizar la Ruta de la API:\*\*  
    \-   Abre \`app/api/slots/route.ts\`.  
    \-   Importa la nueva función \`getDefaultOperatingHours\`.  
    \-   Reemplaza el objeto \`defaultOperatingHours\` hardcodeado con una llamada a la nueva función de servicio.

    \`\`\`typescript  
    // En app/api/slots/route.ts

    // Importa el nuevo servicio  
    import { getDefaultOperatingHours } from '@/lib/services/system-settings';

    // ... dentro de la función GET ...

    // ANTES:  
    // const defaultOperatingHours \= { start: '08:00', end: '23:00', slot\_duration: 90 };

    // AHORA:  
    const defaultOperatingHours \= await getDefaultOperatingHours();

    // El resto de la lógica que usa \`safeParse\` con este fallback funcionará igual.  
    \`\`\`  
\---  
\#\# ✅ Paso 3: Refactorización del Frontend

\*\*Objetivo:\*\* Hacer que la interfaz de usuario sea completamente dinámica, consumiendo datos y configuraciones desde el backend en lugar de definirlos estáticamente.

\#\#\# Tareas

\#\#\#\# 1\. Dinamizar Horarios (\`timeSlots\`)

\-   \*\*Archivos a Modificar:\*\*  
    \-   \`app/(protected)/bookings/components/BookingForm.tsx\`  
    \-   \`app/(protected)/bookings/components/BookingFilters.tsx\`

\-   \*\*Acción:\*\*  
    \-   Elimina los arrays \`timeSlots\` (\`\['08:00', '08:30', ...\]\`) definidos localmente.  
    \-   Implementa un hook de fetching de datos (como \`useQuery\` de TanStack Query o un \`useEffect\` con \`fetch\`) que llame al endpoint \`/api/slots\` cada vez que cambie la cancha o la fecha seleccionada.  
    \-   Usa el resultado de esta llamada a la API para poblar dinámicamente los selectores de horarios.

\#\#\#\# 2\. Centralizar Estados y Estilos (\`statusOptions\`)

\-   \*\*Archivos a Modificar:\*\*  
    \-   \`lib/booking-status-map.ts\` (\*\*Archivo Nuevo\*\*)  
    \-   \`app/admin-panel/bookings/components/BookingList.tsx\`  
    \-   \`app/admin-panel/bookings/components/BookingStats.tsx\`  
    \-   \`app/(protected)/bookings/components/BookingFilters.tsx\`

\-   \*\*Acción:\*\*  
    1\.  Crea el archivo \`lib/booking-status-map.ts\` para centralizar la configuración de etiquetas y estilos.

        \`\`\`typescript  
        // En lib/booking-status-map.ts  
        import { BookingStatus } from '@prisma/client';

        export const bookingStatusMap: Record\<BookingStatus, { label: string; className: string }\> \= {  
          PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },  
          CONFIRMED: { label: 'Confirmado', className: 'bg-green-100 text-green-800' },  
          ACTIVE: { label: 'En Curso', className: 'bg-blue-100 text-blue-800' },  
          COMPLETED: { label: 'Completado', className: 'bg-gray-100 text-gray-800' },  
          CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },  
        };  
        \`\`\`  
    2\.  En todos los componentes listados, elimina las definiciones locales de \`statusColors\`, \`statusLabels\` o \`statusOptions\`.  
    3\.  Importa \`bookingStatusMap\` y úsalo para renderizar las etiquetas, aplicar los estilos y generar las opciones de los filtros.

\---

\#\# ✅ Paso 4: Limpieza Final de Código Obsoleto

\*\*Objetivo:\*\* Eliminar por completo las variables y constantes que se han vuelto redundantes después de la refactorización para mantener el código limpio y mantenible.

\#\#\# Archivos a Revisar  
\- Todos los archivos modificados en el Paso 3\.

\#\#\# Tareas  
1\.  \*\*Buscar y Eliminar:\*\* Realiza una búsqueda en los archivos del frontend de las siguientes constantes y elimínalas:  
    \-   \`const timeSlots \= \[...\]\`  
    \-   \`const statusOptions \= \[...\]\`  
    \-   \`const statusColors \= {...}\`  
    \-   \`const statusLabels \= {...}\`  
    \-   Cualquier otra variable estática que definía horarios, precios, duraciones o estados.

2\.  \*\*Verificar Lógica:\*\* Asegúrate de que no quede ninguna lógica que dependa de estos valores eliminados y que todos los componentes dependan ahora de los datos obtenidos de la API o de los mapas centralizados.  
