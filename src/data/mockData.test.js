import { describe, it, expect } from 'vitest'
import { formatMoney } from './mockData'

describe('formatMoney', () => {
  it('formats 4500 as Argentine pesos', () => {
    const result = formatMoney(4500)
    // Intl may use non-breaking space or regular space depending on locale
    expect(result.replace(/\s/g, '')).toBe('$4.500')
  })

  it('formats 0 as $0', () => {
    const result = formatMoney(0)
    expect(result.replace(/\s/g, '')).toBe('$0')
  })

  it('formats 1500000 with thousands separators', () => {
    const result = formatMoney(1500000)
    expect(result.replace(/\s/g, '')).toBe('$1.500.000')
  })

  it('handles null/undefined as $0', () => {
    expect(formatMoney(null).replace(/\s/g, '')).toBe('$0')
    expect(formatMoney(undefined).replace(/\s/g, '')).toBe('$0')
  })

  it('handles negative values', () => {
    const result = formatMoney(-1000)
    expect(result).toContain('1.000')
  })
})
