import { sendEmailToCaseWorker } from './notify.js'
import { config } from '../../../config.js'
import { createBackendServer } from '../../test-helpers/backend-server.js'

jest.mock('./notify-token-utils.js', () => ({
  createToken: jest.fn().mockReturnValue('mocked-jwt-token')
}))

const testTimeout = 100
const backendPort = 3001

describe('sendNotification (integration)', () => {
  let server

  beforeAll(async () => {
    server = await createBackendServer(backendPort, [
      {
        method: 'POST',
        path: '/mock-notify',
        handler: async (req, res) => {
          await new Promise((resolve) => setTimeout(resolve, testTimeout + 1))
          return res.response(req.payload).code(200)
        }
      }
    ])
  })

  afterAll(async () => {
    await server.stop()
  })

  it('should abort if the configured timeout is hit', async () => {
    const configGet = config.get.bind(config)
    const notifyConfig = {
      ...config.get('notify'),
      timeout: testTimeout,
      url: `http://localhost:${backendPort}/mock-notify`
    }
    jest.spyOn(config, 'get').mockImplementation((name) => {
      if (name === 'notify') {
        return notifyConfig
      } else {
        return configGet(name)
      }
    })

    const testData = { content: 'test' }

    const result = sendEmailToCaseWorker(testData)

    await expect(result).rejects.toThrow(
      `Request to GOV.uk notify timed out after ${testTimeout}ms`
    )
  })
})
