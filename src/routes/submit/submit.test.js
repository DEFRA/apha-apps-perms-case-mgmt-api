import { submit } from './submit.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { spyOnConfig } from '../../common/test-helpers/config.js'
import { sharePointApplicationHandler } from '../../common/helpers/sharepoint/sharepoint.js'
import { emailApplicationHandler } from '../../common/helpers/email/email.js'
import { stubModeApplicationHandler } from '../../common/helpers/stub-mode/stub-mode.js'

const testReferenceNumber = 'TB-1234-5678'

jest.mock(
  '../../common/helpers/application-reference/application-reference.js',
  () => ({
    getApplicationReference: jest.fn().mockReturnValue(testReferenceNumber)
  })
)
jest.mock('./submit-validation.js', () => ({
  isValidRequest: jest.fn().mockReturnValue(true),
  isValidPayload: jest.fn().mockReturnValue(true)
}))
jest.mock('../../common/helpers/sharepoint/sharepoint.js', () => ({
  sharePointApplicationHandler: jest.fn()
}))
jest.mock('../../common/helpers/email/email.js', () => ({
  emailApplicationHandler: jest.fn()
}))
jest.mock('../../common/helpers/stub-mode/stub-mode.js', () => ({
  stubModeApplicationHandler: jest.fn()
}))

const mockIsValidRequest = /** @type {jest.Mock} */ (isValidRequest)
const mockIsValidPayload = /** @type {jest.Mock} */ (isValidPayload)
const mockSharePointApplicationHandler = /** @type {jest.Mock} */ (
  sharePointApplicationHandler
)
const mockEmailApplicationHandler = /** @type {jest.Mock} */ (
  emailApplicationHandler
)
const mockStubModeApplicationHandler = /** @type {jest.Mock} */ (
  stubModeApplicationHandler
)

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }

const mockRequest = {
  logger: mockLogger,
  payload: {
    sections: [
      {
        section: 'licence',
        sectionKey: 'licence',
        questionAnswers: [
          {
            question: 'emailAddress',
            questionKey: 'emailAddress',
            answer: {
              type: 'email',
              value: 'test@example.com',
              displayText: 'test@example.com'
            }
          }
        ]
      }
    ]
  }
}

describe('submit route', () => {
  const mockResponse = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn()
  }

  let handler

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    handler = submit[0].handler
  })

  it('should return 400 if the request is invalid', async () => {
    mockIsValidRequest.mockReturnValue(false)

    await handler(mockRequest, mockResponse)

    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'INVALID_REQUEST'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  it('should return 400 if the payload is invalid', async () => {
    mockIsValidRequest.mockReturnValue(true)
    mockIsValidPayload.mockReturnValue(false)

    await handler(mockRequest, mockResponse)

    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'INVALID_PAYLOAD'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  it('should return 201 with reference when valid and no errors', async () => {
    mockIsValidRequest.mockReturnValue(true)
    mockIsValidPayload.mockReturnValue(true)

    await handler(mockRequest, mockResponse)

    expect(mockLogger.info).toHaveBeenCalledWith(
      `Application submitted successfully with reference: ${testReferenceNumber}`
    )

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should call stub mode handler only if stubMode is true', async () => {
    spyOnConfig('featureFlags', {
      stubMode: true
    })
    mockStubModeApplicationHandler.mockResolvedValue({})

    await handler(mockRequest, mockResponse)
    expect(stubModeApplicationHandler).toHaveBeenCalled()
    expect(sharePointApplicationHandler).not.toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should call sharePointApplicationHandler when sharepointIntegrationEnabled is true', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: true
    })
    mockSharePointApplicationHandler.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(sharePointApplicationHandler).toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should call emailApplicationHandler when sharepointIntegrationEnabled is false', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: false
    })
    mockEmailApplicationHandler.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(sharePointApplicationHandler).not.toHaveBeenCalled()
    expect(emailApplicationHandler).toHaveBeenCalled()
    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should return error and status code if handler returns an error', async () => {
    const errorResponse = {
      error: { errorCode: 'SOME_ERROR', statusCode: 500 }
    }
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: true
    })
    mockSharePointApplicationHandler.mockResolvedValue(errorResponse)

    await handler(mockRequest, mockResponse)

    expect(sharePointApplicationHandler).toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'SOME_ERROR'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(500)
  })
})
