import { createToken, secrets } from './notify-token-utils.js'
import { token } from '@hapi/jwt'

jest.mock('@hapi/jwt', () => ({
  token: {
    generate: jest.fn()
  }
}))

describe('token-utils', () => {
  const secret = '3d844edf-8d35-48ac-975b-e847b4f122b0'
  const iss = '26785a09-ab16-4eb0-8407-a37497a57506'
  const apiKey = `my_test_key-${iss}-${secret}`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate a token with correct payload and options', () => {
    const mockNow = 1_736_430_853_769
    const iat = 1_736_430_854
    jest.spyOn(Date, 'now').mockReturnValue(mockNow)

    const expectedPayload = { iss, iat }
    const expectedOptions = {
      header: { typ: 'JWT', alg: 'HS256' }
    }

    createToken(apiKey)

    expect(token.generate).toHaveBeenCalledWith(
      expectedPayload,
      secret,
      expectedOptions
    )
  })

  it('should correctly extract secret and iss from apiKey', () => {
    const { iss: extractedIss, secret: extractedSecret } = secrets(apiKey)

    expect(extractedIss).toBe(iss)
    expect(extractedSecret).toBe(secret)
  })
})
