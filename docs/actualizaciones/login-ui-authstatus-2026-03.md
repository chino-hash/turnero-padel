# Login: rediseño panel derecho y AuthStatus

**Fecha:** 12 de marzo de 2026

Documentación de los cambios realizados en la pantalla de login: nuevo diseño del panel derecho (glassmorphism, gradiente oscuro, tipografía reducida, logo decorativo) y comportamiento de `AuthStatus` cuando el usuario no está autenticado.

---

## Objetivo

1. **Panel derecho del login**: Ajustar la interfaz a un estilo moderno con fondo en gradiente oscuro difuminado (azul petróleo, negro, gris azulado), efecto glassmorphism, logo decorativo de fondo y tipografía más compacta.
2. **AuthStatus en login**: No mostrar el mensaje "No autenticado" en la página de login, ya que es redundante; seguir mostrando los estados de carga, reintento y error.

---

## Resumen de cambios por archivo

| Archivo | Cambio |
|---------|--------|
| **components/auth/GoogleLoginForm.tsx** | Rediseño del panel derecho: fondo con imagen de cancha + blur + gradiente oscuro; logo decorativo con `public/login/padel copia.svg`; título "Bienvenido a PADELBOOK"; subtítulo y botón Google con tipografía reducida; eliminación del texto inferior "Solo usuarios autorizados...". |
| **components/auth/AuthStatus.tsx** | Cuando `status === 'unauthenticated'` se devuelve `null` en lugar del mensaje "No autenticado". El resto de estados (loading, retrying, error, authenticated) se mantienen. |

---

## 1. GoogleLoginForm — Panel derecho

### Fondo

- **Imagen de cancha**: La misma imagen de la columna izquierda se usa como fondo del panel derecho (continuidad visual) con `backdrop-blur` fuerte para difuminarla.
- **Gradiente oscuro difuminado**: Encima se aplica un gradiente con los colores acordados:
  - Azul petróleo muy oscuro: `#0a2d2d`
  - Negro: `#051a1a`, `#000000`
  - Gris azulado: `#0f172a` (slate-950)
- Transición suave desde la imagen de la cancha hacia el panel.

### Elemento decorativo

- **Logo de fondo**: Se utiliza el asset `public/login/padel copia.svg` (ruta en la app: `/login/padel%20copia.svg`).
- Estilo: gris claro translúcido (`brightness-0 invert`), opacidad baja (~12%), blur suave, alineado a la derecha del panel.
- No interfiere con el contenido principal.

### Contenido (tipografía reducida)

- **Título**: "Bienvenido a PADELBOOK" — `text-xl` / `sm:text-2xl`, blanco, font-semibold, centrado.
- **Subtítulo**: "Accede a tu cuenta para gestionar tus turnos de manera rápida y segura." — `text-sm`, gris claro, `max-w-[280px]`, centrado.
- **Botón**: "Continuar con Google" — `h-10`, `text-sm`, `rounded-lg`, fondo blanco, texto negro, icono de Google a la izquierda.
- **Texto inferior**: Eliminado el párrafo "Solo usuarios autorizados pueden acceder. Contacta al administrador para obtener acceso."

### Layout

- Contenedor central: `max-w-[320px]`, padding reducido (`px-5 py-10`), espaciados (`mt-6`, `gap-3`) acordes a la tipografía más pequeña.

---

## 2. AuthStatus — Estado "No autenticado"

**Archivo:** `components/auth/AuthStatus.tsx`

**Antes:** Cuando `status === 'unauthenticated'` se renderizaba un div con icono y el texto "No autenticado".

**Después:** En el mismo caso se devuelve `return null`. No se muestra ningún elemento en pantalla.

**Estados que siguen mostrándose:**

- `loading`: "Verificando autenticación..." con spinner.
- `isRetrying`: "Reintentando conexión... (n/3)" con spinner.
- `lastError && !isAuthenticated`: Alert con mensaje de error y botón "Reintentar".
- `isAuthenticated && user`: "Conectado como {nombre}" con indicador de rol si aplica.

**Motivación:** En la página de login, indicar "No autenticado" es redundante; el usuario está ahí precisamente para autenticarse. Ocultar ese estado simplifica la UI sin perder información útil.

---

## Referencias

- Componente: `components/auth/GoogleLoginForm.tsx`
- Componente: `components/auth/AuthStatus.tsx`
- Asset decorativo: `public/login/padel copia.svg`
- Imagen de cancha: `public/login/Gemini_Generated_Image_oh3x4joh3x4joh3x.png`
