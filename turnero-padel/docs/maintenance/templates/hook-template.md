# useNombreHook

> **Estado**: 🟢 Estable | 🟡 En desarrollo | 🔴 Experimental
> **Última actualización**: [YYYY-MM-DD]
> **Mantenedor**: [@usuario]

## Descripción

[Descripción breve y clara del propósito del hook]

## Ubicación

```
📁 Hook: src/hooks/useNombreHook.ts
📁 Tipos: src/types/hooks.ts
📁 Tests: src/hooks/__tests__/useNombreHook.test.ts
📁 Ejemplos: src/examples/useNombreHookExample.tsx
```

## Importación

```typescript
import { useNombreHook } from '@/hooks/useNombreHook';
// o
import { useNombreHook } from '@/hooks';
```

## Signatura

```typescript
function useNombreHook(
  parametro1: string,
  parametro2?: number,
  options?: UseNombreHookOptions
): UseNombreHookReturn
```

### Tipos

```typescript
interface UseNombreHookOptions {
  enabled?: boolean;           // Habilitar/deshabilitar el hook
  refetchInterval?: number;    // Intervalo de refetch en ms
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

interface UseNombreHookReturn {
  data: T | null;             // Datos obtenidos
  loading: boolean;           // Estado de carga
  error: Error | null;        // Error si ocurre
  refetch: () => Promise<void>; // Función para refetch manual
  reset: () => void;          // Resetear estado
}
```

## Parámetros

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `parametro1` | `string` | ✅ | - | Descripción del parámetro 1 |
| `parametro2` | `number` | ❌ | `10` | Descripción del parámetro 2 |
| `options` | `UseNombreHookOptions` | ❌ | `{}` | Opciones de configuración |

### Opciones Detalladas

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Si el hook debe ejecutarse automáticamente |
| `refetchInterval` | `number` | `0` | Intervalo para refetch automático (0 = deshabilitado) |
| `onSuccess` | `(data: T) => void` | - | Callback ejecutado en éxito |
| `onError` | `(error: Error) => void` | - | Callback ejecutado en error |
| `initialData` | `T` | `null` | Datos iniciales |

## Valor de Retorno

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `T \| null` | Datos obtenidos por el hook |
| `loading` | `boolean` | `true` mientras está cargando |
| `error` | `Error \| null` | Error si la operación falla |
| `refetch` | `() => Promise<void>` | Función para volver a ejecutar |
| `reset` | `() => void` | Resetear el estado del hook |

## Uso Básico

```typescript
import { useNombreHook } from '@/hooks/useNombreHook';

function MiComponente() {
  const { data, loading, error, refetch } = useNombreHook('parametro1');

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={refetch}>Refetch</button>
    </div>
  );
}
```

## Ejemplos Avanzados

### Con Opciones

```typescript
function ComponenteConOpciones() {
  const { data, loading, error } = useNombreHook('parametro1', 20, {
    enabled: true,
    refetchInterval: 5000, // Refetch cada 5 segundos
    onSuccess: (data) => {
      console.log('Datos obtenidos:', data);
    },
    onError: (error) => {
      console.error('Error:', error);
    }
  });

  return (
    <div>
      {loading ? 'Cargando...' : JSON.stringify(data)}
    </div>
  );
}
```

### Hook Condicional

```typescript
function ComponenteCondicional({ shouldFetch }: { shouldFetch: boolean }) {
  const { data, loading, error } = useNombreHook('parametro1', undefined, {
    enabled: shouldFetch // Solo ejecutar si shouldFetch es true
  });

  return (
    <div>
      {shouldFetch ? (
        loading ? 'Cargando...' : JSON.stringify(data)
      ) : (
        'Hook deshabilitado'
      )}
    </div>
  );
}
```

### Con Estado Local

```typescript
function ComponenteConEstado() {
  const [parametro, setParametro] = useState('inicial');
  const { data, loading, error, refetch } = useNombreHook(parametro);

  const handleParametroChange = (nuevoParametro: string) => {
    setParametro(nuevoParametro);
    // El hook se ejecutará automáticamente con el nuevo parámetro
  };

  return (
    <div>
      <input 
        value={parametro} 
        onChange={(e) => handleParametroChange(e.target.value)} 
      />
      <button onClick={refetch}>Refetch Manual</button>
      {loading ? 'Cargando...' : JSON.stringify(data)}
    </div>
  );
}
```

### Múltiples Instancias

```typescript
function ComponenteMultiple() {
  const hook1 = useNombreHook('parametro1');
  const hook2 = useNombreHook('parametro2');

  const todosLoading = hook1.loading || hook2.loading;
  const hayError = hook1.error || hook2.error;

  if (todosLoading) return <div>Cargando...</div>;
  if (hayError) return <div>Error en algún hook</div>;

  return (
    <div>
      <div>Hook 1: {JSON.stringify(hook1.data)}</div>
      <div>Hook 2: {JSON.stringify(hook2.data)}</div>
    </div>
  );
}
```

## Implementación Interna

### Estructura del Hook

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

export function useNombreHook(
  parametro1: string,
  parametro2: number = 10,
  options: UseNombreHookOptions = {}
): UseNombreHookReturn {
  const {
    enabled = true,
    refetchInterval = 0,
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Función principal de fetch
  const fetchData = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Lógica de fetch aquí
      const result = await fetchDataFromAPI(parametro1, parametro2);
      
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [parametro1, parametro2, enabled, onSuccess, onError]);

  // Función de reset
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Efecto principal
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efecto para refetch interval
  useEffect(() => {
    if (refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset
  };
}
```

## Dependencias

### Hooks de React Utilizados

- `useState`: Para manejar el estado interno
- `useEffect`: Para efectos secundarios
- `useCallback`: Para memoizar funciones
- `useRef`: Para referencias mutables

### Dependencias Externas

```json
{
  "dependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0"
  }
}
```

## Testing

### Setup de Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useNombreHook } from './useNombreHook';

// Mock de la función de fetch
jest.mock('../api/fetchDataFromAPI', () => ({
  fetchDataFromAPI: jest.fn()
}));

const mockFetchDataFromAPI = fetchDataFromAPI as jest.MockedFunction<typeof fetchDataFromAPI>;
```

### Tests Básicos

```typescript
describe('useNombreHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useNombreHook('test'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('debe cargar datos exitosamente', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetchDataFromAPI.mockResolvedValue(mockData);

    const { result } = renderHook(() => useNombreHook('test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar errores correctamente', async () => {
    const mockError = new Error('Test error');
    mockFetchDataFromAPI.mockRejectedValue(mockError);

    const { result } = renderHook(() => useNombreHook('test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});
```

### Tests de Opciones

```typescript
it('debe respetar la opción enabled', () => {
  const { result } = renderHook(() => 
    useNombreHook('test', undefined, { enabled: false })
  );

  expect(mockFetchDataFromAPI).not.toHaveBeenCalled();
  expect(result.current.loading).toBe(false);
});

it('debe ejecutar callbacks de éxito', async () => {
  const mockData = { id: 1, name: 'Test' };
  const onSuccess = jest.fn();
  mockFetchDataFromAPI.mockResolvedValue(mockData);

  renderHook(() => 
    useNombreHook('test', undefined, { onSuccess })
  );

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(onSuccess).toHaveBeenCalledWith(mockData);
});
```

### Tests de Refetch

```typescript
it('debe permitir refetch manual', async () => {
  const mockData = { id: 1, name: 'Test' };
  mockFetchDataFromAPI.mockResolvedValue(mockData);

  const { result } = renderHook(() => useNombreHook('test'));

  await act(async () => {
    await result.current.refetch();
  });

  expect(mockFetchDataFromAPI).toHaveBeenCalledTimes(2); // Initial + refetch
});
```

## Optimización

### Memoización

```typescript
// Usar useMemo para cálculos costosos
const processedData = useMemo(() => {
  if (!data) return null;
  return expensiveProcessing(data);
}, [data]);

// Usar useCallback para funciones que se pasan como props
const memoizedRefetch = useCallback(() => {
  return fetchData();
}, [fetchData]);
```

### Debouncing

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedFetch = useDebouncedCallback(
  fetchData,
  300 // 300ms delay
);
```

### Cancelación de Requests

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const fetchData = useCallback(async () => {
  // Cancelar request anterior
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  abortControllerRef.current = new AbortController();

  try {
    const result = await fetchDataFromAPI(parametro1, {
      signal: abortControllerRef.current.signal
    });
    // ...
  } catch (error) {
    if (error.name !== 'AbortError') {
      // Manejar error real
    }
  }
}, [parametro1]);
```

## Patrones de Uso

### Composición con Otros Hooks

```typescript
function useComplexLogic(id: string) {
  const { data: userData } = useNombreHook(`user-${id}`);
  const { data: settingsData } = useOtroHook(userData?.settingsId);
  
  return {
    user: userData,
    settings: settingsData,
    isComplete: userData && settingsData
  };
}
```

### Hook de Hook (Composición)

```typescript
function useEnhancedNombreHook(parametro: string) {
  const baseHook = useNombreHook(parametro);
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (baseHook.data) {
      setProcessedData(processData(baseHook.data));
    }
  }, [baseHook.data]);

  return {
    ...baseHook,
    processedData
  };
}
```

## Troubleshooting

### Problemas Comunes

#### Hook se ejecuta infinitamente

**Causa**: Dependencias mal configuradas en useEffect.

**Solución**: 
```typescript
// ❌ Incorrecto - objeto se recrea en cada render
const options = { enabled: true };
const { data } = useNombreHook('param', options);

// ✅ Correcto - usar useMemo o definir fuera del componente
const options = useMemo(() => ({ enabled: true }), []);
const { data } = useNombreHook('param', options);
```

#### Memory leaks

**Causa**: No limpiar efectos al desmontar.

**Solución**: Usar cleanup functions y refs para tracking de mounted state.

#### Stale closures

**Causa**: Callbacks que capturan valores antiguos.

**Solución**: Usar useCallback con dependencias correctas.

### Debug

```typescript
// Agregar logs de debug
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('useNombreHook:', { parametro1, parametro2, data, loading, error });
}
```

## Changelog

### v2.1.0 (2024-01-15)
- ✨ Agregado soporte para refetch interval
- 🐛 Corregido memory leak en cleanup
- 📈 Mejorado rendimiento con memoización

### v2.0.0 (2024-01-01)
- 💥 **BREAKING**: Cambiada signatura del hook
- ✨ Agregado soporte para opciones
- 🔧 Refactorizado para mejor TypeScript support

### v1.0.0 (2023-12-01)
- 🎉 Versión inicial del hook

## Referencias

- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Guía de Hooks Personalizados](../../guides/custom-hooks.md)
- [Testing Hooks](../../guides/testing-hooks.md)
- [Patrones de Hooks](../../guides/hook-patterns.md)

---

**Última revisión**: [YYYY-MM-DD] por [@usuario]
**Próxima revisión**: [YYYY-MM-DD]