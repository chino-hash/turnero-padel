/**
 * Utilidades para manejo de arrays
 */

/**
 * Elimina elementos duplicados de un array manteniendo el orden original
 * @param array - Array con posibles duplicados
 * @returns Array sin duplicados manteniendo el orden original
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Elimina elementos duplicados de un array de objetos basado en una propiedad específica
 * @param array - Array de objetos con posibles duplicados
 * @param key - Propiedad por la cual identificar duplicados
 * @returns Array sin duplicados manteniendo el orden original
 */
export function removeDuplicatesByKey<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set<T[K]>()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * Elimina elementos duplicados de un array de strings (case-insensitive)
 * @param array - Array de strings con posibles duplicados
 * @returns Array sin duplicados manteniendo el orden original
 */
export function removeDuplicatesIgnoreCase(array: string[]): string[] {
  const seen = new Set<string>()
  return array.filter(item => {
    const lowerItem = item.toLowerCase()
    if (seen.has(lowerItem)) {
      return false
    }
    seen.add(lowerItem)
    return true
  })
}

/**
 * Combina múltiples arrays eliminando duplicados y manteniendo el orden
 * @param arrays - Arrays a combinar
 * @returns Array combinado sin duplicados
 */
export function mergeArraysUnique<T>(...arrays: T[][]): T[] {
  const combined = arrays.flat()
  return removeDuplicates(combined)
}

/**
 * Elimina elementos duplicados de un array usando una función personalizada de comparación
 * @param array - Array con posibles duplicados
 * @param compareFn - Función que retorna un valor único para cada elemento
 * @returns Array sin duplicados manteniendo el orden original
 */
export function removeDuplicatesBy<T, U>(array: T[], compareFn: (item: T) => U): T[] {
  const seen = new Set<U>()
  const result: T[] = []
  
  for (const item of array) {
    const value = compareFn(item)
    if (!seen.has(value)) {
      seen.add(value)
      result.push(item)
    }
  }
  
  return result
}