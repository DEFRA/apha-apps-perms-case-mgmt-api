import path from 'path'
import { srcFolder } from './path-utils.js'

describe('srcFolder', () => {
  it('should resolve to the project src directory', () => {
    const expectedSrc = path.resolve(__dirname, '../..')
    expect(srcFolder).toBe(expectedSrc)
  })
})
