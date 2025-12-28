import { cn } from '../../lib/utils'

describe('lib/utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle false conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).not.toContain('active-class')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      const result = cn('px-2', 'px-4')
      // twMerge should keep only the last px class
      expect(result).toContain('px-4')
      expect(result).not.toContain('px-2')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toContain('base')
      expect(result).toContain('end')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })
  })
})