import { token } from '@hapi/jwt'

const SECRET_LENGTH = 36
const ISSUER_START_OFFSET = 73
const ISSUER_END_OFFSET = 37

/**
 * @typedef {{ secret: string, iss: string }} notifySecrets
 */

/**
 * @param {string} apiKey
 * @returns {notifySecrets}
 */
export const secrets = (apiKey) => ({
  secret: apiKey.substring(apiKey.length - SECRET_LENGTH, apiKey.length),
  iss: apiKey.substring(
    apiKey.length - ISSUER_START_OFFSET,
    apiKey.length - ISSUER_END_OFFSET
  )
})

/**
 * @param {string} apiKey
 * @returns {string}
 */
export function createToken(apiKey) {
  const iat = Math.round(Date.now() / 1000)
  const { iss, secret } = secrets(apiKey)

  return token.generate({ iss, iat }, secret, {
    header: { typ: 'JWT', alg: 'HS256' }
  })
}
