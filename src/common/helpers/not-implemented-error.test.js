import { NotImplementedError } from './not-implemented-error.js'

describe('NotImplementedError', () => {
  it('should have a message of Not Implemented', () => {
    const error = new NotImplementedError()

    expect(error.message).toBe('Not Implemented')
  })
})
