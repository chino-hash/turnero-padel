# [Nombre del Componente]

> **Estado**: 🟢 Estable | 🟡 En desarrollo | 🔴 Experimental
> **Última actualización**: [YYYY-MM-DD]
> **Mantenedor**: [@usuario]

## Descripción

[Descripción breve y clara del propósito del componente]

## Ubicación

```
📁 Archivo principal: src/components/[ruta]/[NombreComponente].tsx
📁 Tipos: src/types/[nombre].ts
📁 Estilos: src/styles/components/[nombre].css (si aplica)
📁 Tests: src/components/__tests__/[NombreComponente].test.tsx
```

## Uso Básico

```tsx
import { NombreComponente } from '@/components/[ruta]/NombreComponente';

function EjemploUso() {
  return (
    <NombreComponente
      prop1="valor"
      prop2={true}
      onAction={(data) => console.log(data)}
    />
  );
}
```

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `prop1` | `string` | ✅ | - | Descripción de prop1 |
| `prop2` | `boolean` | ❌ | `false` | Descripción de prop2 |
| `onAction` | `(data: T) => void` | ❌ | - | Callback ejecutado cuando... |

### Tipos Relacionados

```typescript
interface NombreComponenteProps {
  prop1: string;
  prop2?: boolean;
  onAction?: (data: ActionData) => void;
}

interface ActionData {
  id: string;
  value: any;
}
```

## Estados del Componente

### Estados Visuales

- **Default**: Estado normal del componente
- **Loading**: Cuando está cargando datos
- **Error**: Cuando ocurre un error
- **Disabled**: Cuando está deshabilitado

### Estados de Datos

- **Empty**: Sin datos para mostrar
- **Populated**: Con datos cargados
- **Updating**: Actualizando datos existentes

## Ejemplos de Uso

### Ejemplo Básico

```tsx
<NombreComponente prop1="ejemplo" />
```

### Ejemplo con Todas las Props

```tsx
<NombreComponente
  prop1="ejemplo completo"
  prop2={true}
  onAction={(data) => {
    // Manejar acción
    console.log('Acción ejecutada:', data);
  }}
/>
```

### Ejemplo con Estado de Loading

```tsx
const [loading, setLoading] = useState(false);

<NombreComponente
  prop1="ejemplo"
  loading={loading}
/>
```

## Personalización

### Estilos CSS

```css
/* Clases CSS disponibles */
.nombre-componente {
  /* Estilos base */
}

.nombre-componente--variant {
  /* Variante específica */
}

.nombre-componente__element {
  /* Elemento interno */
}
```

### Props de Estilo

```tsx
<NombreComponente
  className="mi-clase-personalizada"
  style={{ backgroundColor: '#f0f0f0' }}
/>
```

## Hooks Relacionados

- [`useNombreHook`](../hooks/useNombreHook.md): Para manejar la lógica del componente
- [`useOtroHook`](../hooks/useOtroHook.md): Para funcionalidad adicional

## Componentes Relacionados

- [`ComponenteRelacionado`](./ComponenteRelacionado.md): Componente que se usa junto con este
- [`ComponentePadre`](./ComponentePadre.md): Componente que contiene este

## Testing

### Tests Unitarios

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NombreComponente } from './NombreComponente';

describe('NombreComponente', () => {
  it('renderiza correctamente', () => {
    render(<NombreComponente prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('ejecuta callback al hacer clic', () => {
    const mockCallback = jest.fn();
    render(
      <NombreComponente 
        prop1="test" 
        onAction={mockCallback} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Tests de Integración

```typescript
// Ejemplo de test de integración con otros componentes
it('funciona correctamente con ComponentePadre', () => {
  render(
    <ComponentePadre>
      <NombreComponente prop1="test" />
    </ComponentePadre>
  );
  
  // Verificar interacción
});
```

## Accesibilidad

### Características de Accesibilidad

- ✅ **Navegación por teclado**: Soporta Tab, Enter, Escape
- ✅ **Screen readers**: Incluye aria-labels apropiados
- ✅ **Contraste**: Cumple con WCAG 2.1 AA
- ✅ **Focus management**: Manejo correcto del foco

### Atributos ARIA

```tsx
<NombreComponente
  aria-label="Descripción del componente"
  aria-describedby="descripcion-adicional"
  role="button" // o el rol apropiado
/>
```

## Rendimiento

### Optimizaciones Implementadas

- ✅ **React.memo**: Para evitar re-renders innecesarios
- ✅ **useMemo**: Para cálculos costosos
- ✅ **useCallback**: Para funciones que se pasan como props
- ✅ **Lazy loading**: Para componentes pesados

### Métricas de Rendimiento

- **Bundle size**: ~X KB (gzipped)
- **Render time**: ~X ms (promedio)
- **Memory usage**: ~X MB

## Troubleshooting

### Problemas Comunes

#### Error: "Prop1 is required"

**Causa**: No se está pasando la prop requerida `prop1`.

**Solución**:
```tsx
// ❌ Incorrecto
<NombreComponente />

// ✅ Correcto
<NombreComponente prop1="valor" />
```

#### El componente no se actualiza

**Causa**: Posible problema con las dependencias de useEffect.

**Solución**: Verificar que todas las dependencias estén incluidas en el array de dependencias.

### Debug

```tsx
// Habilitar logs de debug
<NombreComponente 
  prop1="test" 
  debug={true} // Solo en desarrollo
/>
```

## Changelog

### v2.1.0 (2024-01-15)
- ✨ Agregada nueva prop `prop2`
- 🐛 Corregido problema con el estado loading
- 📚 Mejorada documentación

### v2.0.0 (2024-01-01)
- 💥 **BREAKING**: Cambiado nombre de prop `oldProp` a `prop1`
- ✨ Agregado soporte para TypeScript
- 🎨 Rediseño completo de la UI

### v1.0.0 (2023-12-01)
- 🎉 Versión inicial

## Contribuir

### Desarrollo Local

1. Instalar dependencias: `npm install`
2. Ejecutar Storybook: `npm run storybook`
3. Ejecutar tests: `npm test`

### Guidelines

- Seguir las [convenciones de código](../../guides/contributing.md#convenciones-de-código)
- Agregar tests para nuevas funcionalidades
- Actualizar esta documentación

## Referencias

- [Guía de Componentes](../../guides/components.md)
- [Estándares de Código](../../guides/contributing.md)
- [Testing Guidelines](../../guides/testing.md)
- [Storybook](http://localhost:6006)

---

**Última revisión**: [YYYY-MM-DD] por [@usuario]
**Próxima revisión**: [YYYY-MM-DD]