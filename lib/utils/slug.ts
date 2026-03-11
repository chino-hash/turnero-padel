/**
 * Convierte un nombre legible en un slug para URL: minúsculas, sin acentos, solo a-z 0-9 y guiones.
 */
export function nameToSlug(name: string): string {
  if (!name || typeof name !== 'string') return ''
  return name
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
