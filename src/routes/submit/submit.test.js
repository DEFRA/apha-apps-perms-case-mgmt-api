import { submit } from './submit.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../common/connectors/notify/notify.js'
import { getFileProps } from '../../common/helpers/email-content/email-content.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import {
  fetchFile,
  compressFile
} from '../../common/helpers/file/file-utils.js'

jest.mock('../../common/connectors/notify/notify.js')
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
jest.mock('../../common/helpers/file/file-utils.js')
jest.mock('../../common/helpers/email-content/email-content.js', () => ({
  generateEmailContent: jest.fn().mockReturnValue('Case worker email content'),
  getFileProps: jest.fn().mockReturnValue('mocked-link-to-file')
}))

const mockIsValidRequest = /** @type {jest.Mock} */ (isValidRequest)
const mockIsValidPayload = /** @type {jest.Mock} */ (isValidPayload)
const mockFetchFile = /** @type {jest.Mock} */ (fetchFile)
const mockCompressFile = /** @type {jest.Mock} */ (compressFile)

const testEmail = 'test@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB1234678'

const emailQuestion = {
  question: 'emailAddress',
  questionKey: 'emailAddress',
  answer: {
    type: 'email',
    value: 'test@example.com',
    displayText: 'test@example.com'
  }
}
const fullNameQuestion = {
  question: 'fullName',
  questionKey: 'fullName',
  answer: {
    type: 'name',
    value: { firstName: 'Name', lastName: 'Surname' },
    displayText: testFullName
  }
}
const fileQuestion = {
  question: 'upload-plan',
  questionKey: 'upload-plan',
  answer: {
    type: 'file',
    value: {
      skipped: false,
      path: 'file.pdf'
    },
    displayText: 'file.pdf'
  }
}

const mockLogger = { info: jest.fn() }

const mockRequest = {
  logger: mockLogger,
  payload: {
    sections: [
      {
        section: 'licence',
        sectionKey: 'licence',
        questionAnswers: [emailQuestion, fullNameQuestion]
      }
    ]
  }
}

const mockRequestWithFile = {
  logger: mockLogger,
  payload: {
    sections: [
      {
        section: 'licence',
        sectionKey: 'licence',
        questionAnswers: [emailQuestion, fullNameQuestion]
      },
      {
        section: 'biosecurity-map',
        sectionKey: 'biosecurity-map',
        questionAnswers: [fileQuestion]
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

  it('should send emails and return 201 with reference', async () => {
    mockIsValidRequest.mockReturnValue(true)
    mockIsValidPayload.mockReturnValue(true)

    await handler(mockRequest, mockResponse)

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
    expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
  })

  describe('file upload handling', () => {
    const mockFile = {
      file: 'mock-file',
      contentType: 'application/pdf'
    }

    it('should return FILE_TOO_LARGE if file size > 10MB at the point of upload', async () => {
      mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 12 })

      await handler(mockRequestWithFile, mockResponse)

      expect(mockResponse.response).toHaveBeenCalledWith({
        error: 'FILE_TOO_LARGE'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(
        statusCodes.contentTooLarge
      )
    })

    it('should not call compressFile, call getFileProps and include link_to_file if file size is <= 2MB at the point of upload', async () => {
      mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 1 })

      await handler(mockRequestWithFile, mockResponse)

      expect(mockCompressFile).not.toHaveBeenCalled()
      expect(sendEmailToCaseWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Case worker email content',
          link_to_file: 'mocked-link-to-file'
        })
      )
      expect(mockResponse.response).toHaveBeenCalledWith({
        message: testReferenceNumber
      })
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
    })

    it('should call compressFile, call getFileProps and include link_to_file if file size is <= 2MB after compression', async () => {
      mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 5 })
      mockCompressFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 1 })

      await handler(mockRequestWithFile, mockResponse)

      expect(mockCompressFile).toHaveBeenCalled()
      expect(sendEmailToCaseWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Case worker email content',
          link_to_file: 'mocked-link-to-file'
        })
      )
      expect(mockResponse.response).toHaveBeenCalledWith({
        message: testReferenceNumber
      })
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
    })

    it('should return FILE_CANNOT_BE_DELIVERED if file size after compression is > 2MB and <= 10MB', async () => {
      const mockFileData = { ...mockFile, fileSizeInMB: 5 }
      mockFetchFile.mockResolvedValue(mockFileData)
      mockCompressFile.mockResolvedValue(mockFileData)

      await handler(mockRequestWithFile, mockResponse)

      expect(mockResponse.response).toHaveBeenCalledWith({
        error: 'FILE_CANNOT_BE_DELIVERED'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(
        statusCodes.contentTooLarge
      )
    })

    it('should not include link_to_file if fileAnswer is not present', async () => {
      await handler(mockRequest, mockResponse)

      expect(getFileProps).not.toHaveBeenCalled()
      expect(sendEmailToCaseWorker).toHaveBeenCalledWith(
        expect.not.objectContaining({ link_to_file: expect.anything() })
      )
      expect(mockResponse.response).toHaveBeenCalledWith({
        message: testReferenceNumber
      })
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.ok)
    })
  })
})
