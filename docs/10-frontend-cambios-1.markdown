# Especificaciones de Cambios en el Frontend para la Página Web

## Resumen
Este documento detalla las modificaciones requeridas en el frontend de la aplicación web "Turnero de Pádel" desarrollada en Next.js con React y TailwindCSS. Los cambios abarcan optimización de diseño, corrección de errores, nuevas funcionalidades para usuarios y un panel exclusivo para administradores. El objetivo es mejorar la experiencia de usuario (UX), reducir el scroll innecesario y agregar herramientas administrativas robustas. Todos los cambios deben implementarse en archivos específicos del proyecto, asumiendo una estructura estándar de Next.js (por ejemplo, `pages/`, `components/`, `styles/`). Usa TailwindCSS para estilos donde sea posible, y asegúrate de que las interacciones con el backend usen las API Routes de Next.js con Prisma para consultas a la base de datos PostgreSQL.

---

## 1. Optimización de la Distribución Vertical

### Problema
- **Altura excesiva:** El `scrollHeight` de la página es mayor al necesario debido a márgenes y paddings verticales excesivos.
- **Espacios vacíos:** Hay demasiado espacio en blanco entre secciones, lo que aumenta el scroll requerido.

### Instrucciones
#### 1.1 Sección "Mis Turnos"
- **Problema específico:** La sección está posicionada demasiado abajo, requiriendo scroll innecesario.
- **Archivo afectado:** `components/MisTurnos.tsx` (o equivalente; si no existe, crea uno en `components/` y úsalo en `pages/dashboard.tsx`).
- **Acciones:**
  - En el archivo `styles/globals.css` (o `tailwind.config.js` si usas clases), inspecciona y ajusta el selector `#mis-turnos` (o clase `.mis-turnos` en Tailwind):
    - Reducir `margin-top` del valor actual (inspecciona con dev tools; asumido >50px) a `mt-5` (equivalente a 20px en Tailwind).
    - Reducir `padding-top` a `pt-2.5` (10px) si existe.
    - Ajustar `margin-bottom` y `padding-bottom` a `mb-2.5` y `pb-2.5` (10px) para eliminar espacio vacío por debajo.
  - Código de ejemplo en Tailwind (agrega a la clase del componente):
    ```tsx
    <div id="mis-turnos" className="mt-5 pt-2.5 mb-2.5 pb-2.5">
      {/* Contenido existente */}
    </div>
    ```
- **Validación:** La sección debe ser visible al cargar la página en pantallas de 1080p sin scroll o con un scroll mínimo (<100px). Prueba con `window.innerHeight` en consola.

#### 1.2 Sección "Administración"
- **Problema específico:** Similar a "Mis Turnos", la sección está demasiado baja, aumentando el `scrollHeight`.
- **Archivo afectado:** `components/AdminPanel.tsx` (o equivalente; intégralo en `pages/admin.tsx` con chequeo de rol vía NextAuth).
- **Acciones:**
  - En `styles/globals.css` o clases Tailwind, ajusta el selector `#administracion` (o `.administracion`):
    - Reducir `margin-top` a `mt-5` (20px) y `padding-top` a `pt-2.5` (10px).
    - Ajustar `margin-bottom` y `padding-bottom` a `mb-2.5` y `pb-2.5` (10px).
  - Código de ejemplo:
    ```tsx
    <div id="administracion" className="mt-5 pt-2.5 mb-2.5 pb-2.5">
      {/* Contenido existente */}
    </div>
    ```
- **Validación:** La sección debe estar lo más cerca posible del contenido superior, manteniendo un diseño limpio. Usa dev tools para medir `offsetTop`.

### Objetivo
- Minimizar el scroll necesario en pantallas estándar (1080p).
- Asegurar que el `scrollHeight` refleje solo el contenido activo, eliminando espacios vacíos. Usa unidades relativas como `rem` en Tailwind para responsividad.

---

## 2. Corrección de Errores en la Sección de Inicio

### Problema
- En el selector de fechas, el día "Jueves" aparece duplicado.

### Instrucciones
- **Archivo afectado:** `components/DateSelector.tsx` (o equivalente en `pages/index.tsx` o `pages/reservas.tsx`).
- **Tarea específica:**
  - Inspecciona el componente (probablemente un `<select>` o array en React).
  - Verifica la fuente de datos (por ejemplo, un array `const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Jueves', 'Viernes', ...];` – corrige eliminando duplicados).
  - Código de ejemplo corregido:
    ```tsx
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    <select className="...">
      {diasSemana.map((dia) => (
        <option key={dia} value={dia}>{dia}</option>
      ))}
    </select>
    ```
- **Validación:** El selector debe mostrar los días de la semana en orden correcto (Lunes a Domingo) sin duplicados. Prueba renderizando y seleccionando opciones.

---

## 3. Nuevas Funcionalidades en la Sección "Mis Turnos"

### Requerimientos
Implementar las siguientes funcionalidades en `components/MisTurnos.tsx` para mejorar la interacción del usuario con sus turnos. Usa hooks de React como `useState` y `useEffect` para datos dinámicos, y fetch para API calls a `/api/turnos/...`.

1. **Cancelación de Turnos**
   - **Descripción:** Permitir al usuario cancelar un turno programado.
   - **Implementación:**
     - En `components/TurnoCard.tsx`, agrega un botón "Cancelar" en cada tarjeta.
     - Al clic, muestra un modal (usa un componente como `components/Modal.tsx` o librería como Headless UI).
     - Código de ejemplo:
       ```tsx
       import { useState } from 'react';

       const TurnoCard = ({ turno }) => {
         const [showModal, setShowModal] = useState(false);

         const handleCancel = async () => {
           await fetch(`/api/turnos/cancelar/${turno.id}`, { method: 'POST' });
           setShowModal(false);
           // Refresca la lista de turnos
         };

         return (
           <div className="...">
             <button onClick={() => setShowModal(true)} className="bg-red-500 ...">Cancelar</button>
             {showModal && (
               <div className="modal"> {/* Modal estilizado */}
                 <p>¿Estás seguro de cancelar este turno?</p>
                 <button onClick={handleCancel}>Sí</button>
                 <button onClick={() => setShowModal(false)}>No</button>
               </div>
             )}
           </div>
         );
       };
       ```
   - **Validación:** El turno cancelado debe desaparecer de la lista de turnos activos tras refresh.

2. **Visualización de Turnos Completados**
   - **Descripción:** Mostrar una lista de turnos finalizados.
   - **Implementación:**
     - En `components/MisTurnos.tsx`, crea una pestaña o filtro "Turnos Completados" (usa tabs de Tailwind).
     - Obtén datos con `useEffect`: `fetch('/api/turnos/completados')`.
     - Código de ejemplo:
       ```tsx
       const [completados, setCompletados] = useState([]);
       useEffect(() => {
         fetch('/api/turnos/completados').then(res => res.json()).then(setCompletados);
       }, []);

       <ul>
         {completados.map(turno => (
           <li key={turno.id}>{turno.fecha} - {turno.hora} - Pagado: {turno.estadoPago}</li>
         ))}
       </ul>
       ```
   - **Validación:** La lista debe mostrar solo turnos con estado "finalizado" del backend.

3. **Estado de Pago del Turno Actual**
   - **Descripción:** Indicar si el turno actual está pagado o pendiente.
   - **Implementación:**
     - En `components/TurnoCard.tsx`, agrega un indicador.
     - Obtén estado con `fetch('/api/turnos/${id}/pago')`.
     - Código: `<span className={turno.pagado ? 'text-green-500' : 'text-red-500'}>{turno.pagado ? 'Pagado' : 'Pendiente'}</span>`
   - **Validación:** El estado debe coincidir con los datos del backend.

4. **Información en Tiempo Real del Turno Actual**
   - **Descripción:** Mostrar el tiempo restante y el estado de pago para turnos en curso.
   - **Implementación:**
     - Usa `useEffect` con intervalo para temporizador.
     - Código de ejemplo en `components/TurnoCard.tsx`:
       ```tsx
       const [tiempoRestante, setTiempoRestante] = useState('');
       useEffect(() => {
         const interval = setInterval(() => {
           const fin = new Date(turno.fin);
           const diff = fin - new Date();
           setTiempoRestante(`${Math.floor(diff / 60000)} minutos restantes`);
         }, 1000);
         return () => clearInterval(interval);
       }, [turno]);
       ```
     - Incluye estado de pago como en el punto anterior.
   - **Validación:** El temporizador debe actualizarse cada segundo y el estado de pago debe ser correcto.

5. **Detalles de Pago de Turnos Futuros**
   - **Descripción:** Mostrar el monto pagado hasta el momento para turnos futuros.
   - **Implementación:**
     - En `components/TurnoCard.tsx`, agrega: `<p>Pagado: ${turno.pagado} / Total: ${turno.total}</p>`
     - Obtén datos con `fetch('/api/turnos/${id}/pagos')`.
   - **Validación:** Los montos deben reflejar los datos reales del backend.

---

## 4. Implementación de Modo Oscuro

### Requerimiento
- Agregar un botón toggle para alternar entre modo claro y modo oscuro.

### Instrucciones
- **Archivo afectado:** `components/ThemeToggle.tsx` (crea si no existe) y `pages/_app.tsx` para aplicar tema global.
- **Implementación:**
  - Usa Tailwind con dark mode: agrega `darkMode: 'class'` en `tailwind.config.js`.
  - Guarda en `localStorage`.
  - Código de ejemplo:
    ```tsx
    // ThemeToggle.tsx
    import { useEffect, useState } from 'react';

    const ThemeToggle = () => {
      const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

      useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
      }, [theme]);

      return (
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
      );
    };
    ```
  - Aplica en componentes: `<div className="bg-white dark:bg-gray-900 text-black dark:text-white">`
- **Validación:** El cambio debe aplicarse instantáneamente y persistir al recargar. Prueba en dev tools.

---

## 5. Panel de Administrador (Exclusivo para Rol Administrador)

### Visibilidad
- Solo accesible para usuarios con rol "administrador" (valida con `useSession` de NextAuth en `pages/admin.tsx` y backend check en API Routes).

### 5.1 Panel General
- **Vista de Turnos:**
  - En `components/AdminTurnos.tsx`, muestra lista y calendario.
  - Lista: `<table>` con columnas 'Hora', 'Usuario', 'Estado' (usa colores Tailwind: `bg-blue-500` para confirmado, etc.).
  - Calendario: Si FullCalendar está instalado (`npm i @fullcalendar/react @fullcalendar/daygrid`), intégralo; sino, usa tabla simple.
  - Código ejemplo para lista:
    ```tsx
    <table className="...">
      <thead><tr><th>Hora</th><th>Usuario</th><th>Estado</th></tr></thead>
      <tbody>
        {turnos.map(t => (
          <tr key={t.id}>
            <td>{t.hora}</td>
            <td>{t.usuario}</td>
            <td className={t.estado === 'confirmado' ? 'bg-blue-500' : 'bg-red-500'}>{t.estado}</td>
          </tr>
        ))}
      </tbody>
    </table>
    ```
  - Acceso rápido: Estadísticas con fetch a `/api/reportes/...`.

### 5.2 Gestión de Turnos
- **Datos del turno:** En `components/TurnoAdminCard.tsx`, muestra hora, usuario, jugadores, estado.
- **Pagos por turno:** Divide costo en 4: `costoPorJugador = total / 4;`. Toggle por jugador con `<input type="checkbox" onChange={handlePago} />`.
- **Extras:** Formulario para agregar (select para tipo, input para monto). Actualiza total con state.
- **Validación:** Cambios en UI y POST a `/api/turnos/update`.

### 5.3 Control de Pagos
- **Vista:** En `components/PagosAdmin.tsx`, lista con filtros (usa `useState` para filtros).
- **Acción:** Form para marcar pagos, POST a `/api/pagos/update`.
- **Validación:** Actualiza backend y refresca UI.

### 5.4 Reportes y Estadísticas
- **Gráficas:** Usa Chart.js si instalado (`npm i chart.js react-chartjs-2`); crea en `components/StatsChart.tsx`.
  - Ejemplo para ocupación: 
    ```tsx
    import { Bar } from 'react-chartjs-2';
    const data = { labels: ['Lun', 'Mar'], datasets: [{ data: [5, 8] }] };
    <Bar data={data} />
    ```
  - Obtén datos de `/api/reportes/ocupacion`.
- **Informe de cierre:** Tabla con totales.

### 5.5 Configuraciones Administrativas
- **Lista de precios:** Form editable en `components/ConfigAdmin.tsx`, POST a `/api/config/update`.
- **Gestión de turnos:** Botones para editar/deshabilitar, con modals.

### 5.6 Funciones Extras
- **Marcar iniciado/finalizado:** `useEffect` comparando `new Date()` con turno.hora.
- **Notificaciones:** Usa WebSockets o polling para avisos.
- **Modo rápido:** Form simplificado en `components/CobroRapido.tsx`.

---

## Notas de Implementación
- **CSS:** Usa Tailwind con clases como `mt-5`, `dark:bg-gray-900` para responsividad.
- **JavaScript/React:** Componentes funcionales con hooks. Integra con NextAuth para auth.
- **Backend:** Usa API Routes como `/api/turnos/[id].ts` con Prisma para queries.
- **Pruebas:** Agrega tests en `tests/` con Jest (por ejemplo, `MisTurnos.test.tsx`).
- **Persistencia:** `localStorage` para tema; session para datos temporales.