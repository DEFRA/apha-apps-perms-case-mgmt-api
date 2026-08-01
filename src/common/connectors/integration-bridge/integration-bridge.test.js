const mockConfig = {
  get: jest.fn()
}

const mockWreckPost = jest.fn()

const mockRequests = {
  Wreck: {
    post: mockWreckPost
  }
}

jest.mock('../../../config.js', () => ({
  __esModule: true,
  config: mockConfig
}))

jest.mock('./requests.js', () => ({
  __esModule: true,
  ...mockRequests
}))

let runCphMatching

beforeEach(async () => {
  jest.resetModules()
  const module = await import('./integration-bridge.js')
  runCphMatching = module.runCphMatching
})

afterEach(() => {
  jest.clearAllMocks()
})

test('does not perform CPH matching when feature flag is disabled', async () => {
  mockConfig.get.mockImplementation((name) => {
    if (name === 'featureFlags.cphMatchingEnabled') {
      return false
    }
    if (name === 'integrationBridge.baseUrl') {
      return null
    }
    if (name === 'integrationBridge.timeout') {
      return 5000
    }
    return undefined
  })

  await runCphMatching({
    payload: { keyFacts: { originCph: '12/123/1234' } },
    applicationId: 'TB-1234-5678',
    logger: { info: jest.fn(), debug: jest.fn() }
  })

  expect(mockWreckPost).not.toHaveBeenCalled()
})

test('calls Integration Bridge and logs match results for submitted CPHs', async () => {
  mockConfig.get.mockImplementation((name) => {
    if (name === 'featureFlags.cphMatchingEnabled') {
      return true
    }
    if (name === 'integrationBridge.baseUrl') {
      return 'http://integration-bridge'
    }
    if (name === 'integrationBridge.timeout') {
      return 5000
    }
    if (name === 'integrationBridge.tokenUrl') {
      return 'http://integration-bridge/oauth2/token'
    }
    if (name === 'integrationBridge.clientId') {
      return 'client-id'
    }
    if (name === 'integrationBridge.clientSecret') {
      return 'client-secret'
    }
    return undefined
  })

  mockWreckPost
    .mockResolvedValueOnce({
      res: { statusCode: 200 },
      payload: Buffer.from(
        JSON.stringify({ access_token: 'abc123', expires_in: 300 })
      )
    })
    .mockResolvedValueOnce({
      res: { statusCode: 200 },
      payload: Buffer.from(JSON.stringify({ data: [{ id: '12/123/1234' }] }))
    })

  const mockLogger = { info: jest.fn(), debug: jest.fn() }
  const payload = {
    keyFacts: {
      originCph: '12/123/1234',
      destinationCph: '98/987/9876'
    }
  }

  await runCphMatching({
    payload,
    applicationId: 'TB-1234-5678',
    logger: mockLogger
  })

  expect(mockWreckPost).toHaveBeenCalledWith(
    'http://integration-bridge/oauth2/token',
    {
      payload:
        'grant_type=client_credentials&client_id=client-id&client_secret=client-secret',
      headers: {
        Authorization: 'Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000
    }
  )
  expect(mockWreckPost).toHaveBeenCalledWith(
    'http://integration-bridge/holdings/find',
    {
      payload: JSON.stringify({ ids: ['12/123/1234', '98/987/9876'] }),
      headers: {
        Authorization: 'Bearer abc123',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }
  )
  expect(mockLogger.info).toHaveBeenCalledWith(
    {
      cphMatch: {
        applicationCph: '12/123/1234',
        result: true,
        type: 'origin',
        applicationId: 'TB-1234-5678'
      }
    },
    'CPH match result'
  )
  expect(mockLogger.info).toHaveBeenCalledWith(
    {
      cphMatch: {
        applicationCph: '98/987/9876',
        result: false,
        type: 'destination',
        applicationId: 'TB-1234-5678'
      }
    },
    'CPH match result'
  )
})
