# Fix: icono de Canchas visible en navbar del admin (2026-03)

## Problema
En la barra de navegación superior del panel de administración, el icono del enlace "Canchas" no se veía: quedaba tapado por el botón "Admin" o recortado por el borde del contenedor.

## Solución
Cambios en `app/admin-panel/components/AdminLayoutContent.tsx`:

1. **Separación entre bloques**  
   Se añadió `gap-3 lg:gap-4` al contenedor flex del header para separar el bloque logo + "Admin", la navegación central y los botones de la derecha.

2. **Bloque izquierdo que no invada el nav**  
   El contenedor del logo y del botón "Admin" usa `shrink-0` para que no se encoja ni ocupe espacio del nav.

3. **Nav que no recorte el primer ítem**  
   - `justify-center` sustituido por `justify-start` para que el primer enlace (Canchas) no se recorte por la izquierda.  
   - Padding izquierdo en el nav (`pl-2`) para que el icono de Canchas no quede en el borde.  
   - Cada `Link` del nav tiene `shrink-0` para que no se compriman icono ni texto.

4. **Accesibilidad**  
   Se añadió `aria-hidden` a los iconos decorativos de los enlaces.

## Archivos modificados
- `app/admin-panel/components/AdminLayoutContent.tsx`

## Referencia
- Changelog: entrada en `CHANGELOG.md` bajo [Unreleased] → Corregido.
