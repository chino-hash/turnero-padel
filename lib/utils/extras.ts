export function splitEven(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor((total / count) * 100) / 100
  const remainder = Number((total - base * count).toFixed(2))
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    result.push(Number((base + (i === 0 ? remainder : 0)).toFixed(2)))
  }
  return result
}