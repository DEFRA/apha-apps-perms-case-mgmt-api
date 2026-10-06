import hapi from '@hapi/hapi'
import { startSQSQueuePolling } from '../connectors/queue/sqs-consumer.js'

const mockLoggerInfo = jest.fn()
const mockLoggerError = jest.fn()

const mockHapiLoggerInfo = jest.fn()
const mockHapiLoggerError = jest.fn()

jest.mock('hapi-pino', () => ({
  register: (server) => {
    server.decorate('server', 'logger', {
      info: mockHapiLoggerInfo,
      error: mockHapiLoggerError
    })
  },
  name: 'mock-hapi-pino'
}))
jest.mock('./logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))

jest.mock('../connectors/queue/sqs-consumer.js', () => ({
  startSQSQueuePolling: jest.fn().mockResolvedValue(null),
  closeSQSConsumerClient: jest.fn().mockResolvedValue(null)
}))
jest.mock('../connectors/queue/sqs-producer.js', () => ({
  closeSQSProducerClient: jest.fn().mockResolvedValue(null)
}))

describe('#startServer', () => {
  const PROCESS_ENV = process.env
  let createServerSpy
  let hapiServerSpy
  let startServerImport
  let createServerImport
  let config
  let spyOnConfig

  beforeAll(async () => {
    process.env = { ...PROCESS_ENV }
    process.env.PORT = '3098' // Set to obscure port to avoid conflicts

    spyOnConfig = (await import('../test-helpers/config.js')).spyOnConfig
    config = (await import('../../config.js')).config
    createServerImport = await import('../../server.js')
    startServerImport = await import('./start-server.js')

    createServerSpy = jest.spyOn(createServerImport, 'createServer')
    hapiServerSpy = jest.spyOn(hapi, 'server')
  })

  afterAll(() => {
    process.env = PROCESS_ENV
  })

  describe('When server starts', () => {
    let server

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    it('Should start up server as expected', async () => {
      server = await startServerImport.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()
      expect(mockHapiLoggerInfo).toHaveBeenNthCalledWith(
        1,
        'Custom secure context is disabled'
      )
      expect(mockHapiLoggerInfo).toHaveBeenNthCalledWith(
        2,
        'Setting up MongoDb'
      )
      expect(mockHapiLoggerInfo).toHaveBeenNthCalledWith(
        3,
        'MongoDb connected to apha-apps-perms-case-mgmt-api'
      )
      expect(mockHapiLoggerInfo).toHaveBeenNthCalledWith(
        4,
        'Server started successfully'
      )
      expect(mockHapiLoggerInfo).toHaveBeenNthCalledWith(
        5,
        'Access your backend on http://localhost:3098'
      )
    })
  })

  describe('SQS queue polling feature flags', () => {
    let server

    beforeEach(() => {
      jest.mocked(startSQSQueuePolling).mockClear()
    })

    afterEach(async () => {
      config.get.mockRestore()
      await server.stop({ timeout: 0 })
    })

    it('Should start SQS queue polling when caseManagementIntegrationEnabled is true', async () => {
      spyOnConfig('featureFlags', {
        caseManagementIntegrationEnabled: true,
        sharepointIntegrationEnabled: false
      })

      server = await startServerImport.startServer()

      expect(startSQSQueuePolling).toHaveBeenCalledTimes(1)
    })

    it('Should start SQS queue polling when sharepointIntegrationEnabled is true', async () => {
      spyOnConfig('featureFlags', {
        caseManagementIntegrationEnabled: false,
        sharepointIntegrationEnabled: true
      })

      server = await startServerImport.startServer()

      expect(startSQSQueuePolling).toHaveBeenCalledTimes(1)
    })

    it('Should not start SQS queue polling when both flags are false', async () => {
      spyOnConfig('featureFlags', {
        caseManagementIntegrationEnabled: false,
        sharepointIntegrationEnabled: false
      })

      server = await startServerImport.startServer()

      expect(startSQSQueuePolling).not.toHaveBeenCalled()
    })
  })

  describe('When server start fails', () => {
    beforeAll(() => {
      createServerSpy.mockRejectedValue(new Error('Server failed to start'))
    })

    it('Should log failed startup message', async () => {
      await startServerImport.startServer()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Server failed to start :(')
      expect(mockLoggerError).toHaveBeenCalledWith(
        Error('Server failed to start')
      )
    })
  })
})
