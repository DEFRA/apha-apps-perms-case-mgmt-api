import { submit } from './submit.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../common/connectors/notify/notify.js'
import { getApplicationReference } from '../../common/helpers/application-reference/index.js'
import { getQuestionFromSections } from '../../common/helpers/data-extract/data-extract.js'
import { generateEmailContent } from '../../common/helpers/email-content/email-content.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'

jest.mock('../../common/connectors/notify/notify.js')
jest.mock('../../common/helpers/application-reference/index.js', () => ({
  getApplicationReference: jest.fn().mockReturnValue(testReferenceNumber)
}))
jest.mock('../../common/helpers/data-extract/data-extract.js', () => ({
  getQuestionFromSections: jest.fn().mockImplementation((id) => {
    if (id === 'emailAddress') {
      return { answer: { displayText: testEmail } }
    }
    if (id === 'fullName') {
      return { answer: { displayText: testFullName } }
    }
  })
}))
jest.mock('../../common/helpers/email-content/email-content.js', () => ({
  generateEmailContent: jest.fn().mockReturnValue('Case worker email content')
}))
jest.mock('./submit-validation.js', () => ({
  isValidRequest: jest.fn(),
  isValidPayload: jest.fn()
}))

const mockIsValidRequest = /** @type {jest.Mock} */ (isValidRequest)
const mockIsValidPayload = /** @type {jest.Mock} */ (isValidPayload)

const testEmail = 'test@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB1234678'

describe('submit route', () => {
  const mockRequest = {
    payload: {
      sections: [
        {
          questions: [
            {
              id: 'emailAddress',
              answer: { displayText: testEmail }
            },
            {
              id: 'fullName',
              answer: { displayText: testFullName }
            }
          ]
        }
      ]
    }
  }
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
    expect(mockResponse.code).toHaveBeenCalledWith(400)
  })

  it('should return 400 if the payload is invalid', async () => {
    mockIsValidRequest.mockReturnValue(true)
    mockIsValidPayload.mockReturnValue(false)

    await handler(mockRequest, mockResponse)

    expect(mockResponse.response).toHaveBeenCalledWith({
      error: 'INVALID_PAYLOAD'
    })
    expect(mockResponse.code).toHaveBeenCalledWith(400)
  })

  it('should send emails and return 201 with reference', async () => {
    mockIsValidRequest.mockReturnValue(true)
    mockIsValidPayload.mockReturnValue(true)

    await handler(mockRequest, mockResponse)

    expect(getApplicationReference).toHaveBeenCalled()
    expect(getQuestionFromSections).toHaveBeenCalledWith(
      'emailAddress',
      'licence',
      mockRequest.payload.sections
    )
    expect(getQuestionFromSections).toHaveBeenCalledWith(
      'fullName',
      'licence',
      mockRequest.payload.sections
    )
    expect(generateEmailContent).toHaveBeenCalledWith(
      mockRequest.payload,
      testReferenceNumber
    )
    expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
      content: 'Case worker email content'
    })
    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(mockResponse.response).toHaveBeenCalledWith({
      message: testReferenceNumber
    })
    expect(mockResponse.code).toHaveBeenCalledWith(201)
  })
})
