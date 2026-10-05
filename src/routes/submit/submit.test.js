import { submit } from './submit.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { spyOnConfig } from '../../common/test-helpers/config.js'
import { emailApplicationHandler } from '../../common/helpers/email/email.js'
import { stubModeApplicationHandler } from '../../common/helpers/stub-mode/stub-mode.js'
import { queueApplication } from '../../common/helpers/queue/queue.js'

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
jest.mock('../../common/helpers/email/email.js', () => ({
  emailApplicationHandler: jest.fn()
}))
jest.mock('../../common/helpers/stub-mode/stub-mode.js', () => ({
  stubModeApplicationHandler: jest.fn()
}))
jest.mock('../../common/helpers/queue/queue.js', () => ({
  queueApplication: jest.fn()
}))

const mockIsValidRequest = /** @type {jest.Mock} */ (isValidRequest)
const mockIsValidPayload = /** @type {jest.Mock} */ (isValidPayload)
const mockEmailApplicationHandler = /** @type {jest.Mock} */ (
  emailApplicationHandler
)
const mockStubModeApplicationHandler = /** @type {jest.Mock} */ (
  stubModeApplicationHandler
)
const mockQueueApplication = /** @type {jest.Mock} */ (queueApplication)

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }

const mockRequest = {
  logger: mockLogger,
  payload: {
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
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
    expect(queueApplication).not.toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should queue application when sharepointIntegrationEnabled is true', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: true,
      emailBackupEnabled: false
    })
    mockQueueApplication.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(queueApplication).toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should queue application when caseManagementIntegrationEnabled is true', async () => {
    spyOnConfig('featureFlags', {
      caseManagementIntegrationEnabled: true,
      sharepointIntegrationEnabled: false,
      emailBackupEnabled: false
    })
    mockQueueApplication.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(queueApplication).toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should queue application and backup with email when one integration is enabled and backup is enabled', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: true,
      emailBackupEnabled: true
    })
    mockQueueApplication.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(queueApplication).toHaveBeenCalled()
    expect(emailApplicationHandler).toHaveBeenCalledTimes(1)

    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  it('should call emailApplicationHandler when sharepoint and case management integrations are disabled', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: false,
      emailBackupEnabled: false
    })
    mockEmailApplicationHandler.mockResolvedValue({})

    await handler(mockRequest, mockResponse)

    expect(queueApplication).not.toHaveBeenCalled()
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
      emailBackupEnabled: false,
      sharepointIntegrationEnabled: true
    })
    mockQueueApplication.mockResolvedValue(errorResponse)

    await handler(mockRequest, mockResponse)

    expect(queueApplication).toHaveBeenCalled()
    expect(emailApplicationHandler).not.toHaveBeenCalled()

    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'SOME_ERROR'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(500)
  })

  it('should log when queue application fails', async () => {
    spyOnConfig('featureFlags', {
      sharepointIntegrationEnabled: true,
      emailBackupEnabled: false,
      caseManagementIntegrationEnabled: true
    })
    mockQueueApplication.mockResolvedValue({
      error: { errorCode: 'MESSAGE_ENQUEUEING_FAILED', statusCode: 500 }
    })

    await handler(mockRequest, mockResponse)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Queueing failed')
    )
    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'MESSAGE_ENQUEUEING_FAILED'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(500)
  })
})
