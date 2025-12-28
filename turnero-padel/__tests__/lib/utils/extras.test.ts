import { splitEven } from '../../../lib/utils/extras'

describe('splitEven', () => {
  it('divide en partes iguales con redondeo a centavos', () => {
    const result = splitEven(100, 3)
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 2)
    expect(result.length).toBe(3)
  })

  it('asigna el residuo al primer elemento', () => {
    const result = splitEven(10, 3)
    expect(result[0]).toBeCloseTo(3.34, 2)
    expect(result[1]).toBeCloseTo(3.33, 2)
    expect(result[2]).toBeCloseTo(3.33, 2)
  })

  it('maneja casos límites', () => {
    expect(splitEven(0, 2)).toEqual([0, 0])
    expect(splitEven(10, 0)).toEqual([])
    expect(splitEven(10, 1)).toEqual([10])
  })
})