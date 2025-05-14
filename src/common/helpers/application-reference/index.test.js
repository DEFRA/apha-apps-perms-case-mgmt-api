import { getApplicationReference } from './index.js'

describe('#Application reference generation', () => {
  it('Should generate a reference with the correct format', () => {
    const result = getApplicationReference()
    expect(result).toBeDefined()
    expect(result).toHaveLength(12)
    expect(result).toMatch(/^TB-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })

  it('Should generate unique references', () => {
    const generatedReferences = new Set()
    const iterations = 60_000 // annual limit of 50k applications + some buffer

    for (let i = 0; i < iterations; i++) {
      const result = getApplicationReference()
      expect(result).toBeDefined()
      expect(result).toHaveLength(12)
      expect(generatedReferences.has(result)).toBe(false)
      generatedReferences.add(result)
    }
  })
})
