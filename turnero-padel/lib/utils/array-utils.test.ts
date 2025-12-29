/**
 * Pruebas para las utilidades de eliminación de duplicados
 */

import { 
  removeDuplicates, 
  removeDuplicatesByKey, 
  removeDuplicatesIgnoreCase, 
  mergeArraysUnique, 
  removeDuplicatesBy 
} from './array-utils'

describe('Array Utils - Eliminación de Duplicados', () => {
  describe('removeDuplicates', () => {
    it('debe eliminar duplicados de un array de strings', () => {
      const input = ['a', 'b', 'a', 'c', 'b', 'd']
      const expected = ['a', 'b', 'c', 'd']
      expect(removeDuplicates(input)).toEqual(expected)
    })

    it('debe eliminar duplicados de un array de números', () => {
      const input = [1, 2, 1, 3, 2, 4]
      const expected = [1, 2, 3, 4]
      expect(removeDuplicates(input)).toEqual(expected)
    })

    it('debe mantener el orden original', () => {
      const input = ['z', 'a', 'z', 'b', 'a']
      const expected = ['z', 'a', 'b']
      expect(removeDuplicates(input)).toEqual(expected)
    })

    it('debe manejar arrays vacíos', () => {
      expect(removeDuplicates([])).toEqual([])
    })
  })

  describe('removeDuplicatesByKey', () => {
    it('debe eliminar duplicados por clave específica', () => {
      const input = [
        { id: 1, name: 'Juan' },
        { id: 2, name: 'María' },
        { id: 1, name: 'Juan Duplicado' },
        { id: 3, name: 'Carlos' }
      ]
      const expected = [
        { id: 1, name: 'Juan' },
        { id: 2, name: 'María' },
        { id: 3, name: 'Carlos' }
      ]
      expect(removeDuplicatesByKey(input, 'id')).toEqual(expected)
    })

    it('debe mantener el primer elemento cuando hay duplicados', () => {
      const input = [
        { email: 'juan@test.com', role: 'admin' },
        { email: 'maria@test.com', role: 'user' },
        { email: 'juan@test.com', role: 'user' }
      ]
      const expected = [
        { email: 'juan@test.com', role: 'admin' },
        { email: 'maria@test.com', role: 'user' }
      ]
      expect(removeDuplicatesByKey(input, 'email')).toEqual(expected)
    })
  })

  describe('removeDuplicatesIgnoreCase', () => {
    it('debe eliminar duplicados ignorando mayúsculas/minúsculas', () => {
      const input = ['Juan', 'MARÍA', 'juan', 'Carlos', 'maría']
      const expected = ['Juan', 'MARÍA', 'Carlos']
      expect(removeDuplicatesIgnoreCase(input)).toEqual(expected)
    })
  })

  describe('mergeArraysUnique', () => {
    it('debe combinar múltiples arrays eliminando duplicados', () => {
      const array1 = ['a', 'b', 'c']
      const array2 = ['b', 'c', 'd']
      const array3 = ['c', 'd', 'e']
      const expected = ['a', 'b', 'c', 'd', 'e']
      expect(mergeArraysUnique(array1, array2, array3)).toEqual(expected)
    })

    it('debe manejar arrays vacíos', () => {
      const array1 = ['a', 'b']
      const array2: string[] = []
      const array3 = ['b', 'c']
      const expected = ['a', 'b', 'c']
      expect(mergeArraysUnique(array1, array2, array3)).toEqual(expected)
    })
  })

  describe('removeDuplicatesBy', () => {
    it('debe eliminar duplicados usando función personalizada', () => {
      const input = [
        { name: 'Juan Pérez', email: 'juan@test.com' },
        { name: 'María García', email: 'maria@test.com' },
        { name: 'Juan López', email: 'juan@test.com' }
      ]
      const expected = [
        { name: 'Juan Pérez', email: 'juan@test.com' },
        { name: 'María García', email: 'maria@test.com' }
      ]
      expect(removeDuplicatesBy(input, item => item.email)).toEqual(expected)
    })

    it('debe funcionar con funciones de transformación complejas', () => {
      const input = [
        { firstName: 'Juan', lastName: 'Pérez' },
        { firstName: 'María', lastName: 'García' },
        { firstName: 'Juan', lastName: 'Pérez' }, // Duplicado exacto
        { firstName: 'Carlos', lastName: 'López' }
      ]
      const result = removeDuplicatesBy(input, item => 
        `${item.firstName.toLowerCase()}-${item.lastName.toLowerCase()}`
      )
      
      // Verificar que se eliminó el duplicado y se mantuvieron solo 3 elementos
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ firstName: 'Juan', lastName: 'Pérez' })
      expect(result[1]).toEqual({ firstName: 'María', lastName: 'García' })
      expect(result[2]).toEqual({ firstName: 'Carlos', lastName: 'López' })
    })
  })

  describe('Casos de uso reales del proyecto', () => {
    it('debe limpiar lista de administradores', () => {
      const envAdmins = ['admin@test.com', 'super@test.com', 'admin@test.com']
      const dbAdmins = ['user@test.com', 'admin@test.com', 'manager@test.com']
      
      const cleanEnvAdmins = removeDuplicates(envAdmins)
      const cleanDbAdmins = removeDuplicates(dbAdmins)
      const allAdmins = mergeArraysUnique(cleanEnvAdmins, cleanDbAdmins)
      
      expect(allAdmins).toEqual([
        'admin@test.com', 
        'super@test.com', 
        'user@test.com', 
        'manager@test.com'
      ])
    })

    it('debe limpiar lista de beneficios de usuarios', () => {
      const beneficios = [
        'Descuento 15%', 
        'Reserva prioritaria', 
        'Descuento 15%', 
        'Acceso a eventos exclusivos'
      ]
      const expected = [
        'Descuento 15%', 
        'Reserva prioritaria', 
        'Acceso a eventos exclusivos'
      ]
      expect(removeDuplicates(beneficios)).toEqual(expected)
    })

    it('debe limpiar lista de características de canchas', () => {
      const features = [
        'Iluminación LED', 
        'Césped artificial premium', 
        'Vestuarios', 
        'Iluminación LED'
      ]
      const expected = [
        'Iluminación LED', 
        'Césped artificial premium', 
        'Vestuarios'
      ]
      expect(removeDuplicates(features)).toEqual(expected)
    })
  })
})