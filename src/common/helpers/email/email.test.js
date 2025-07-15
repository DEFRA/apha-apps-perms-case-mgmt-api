import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../../common/connectors/notify/notify.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import {
  compressFile,
  fetchFile
} from '../../../common/helpers/file/file-utils.js'
import { emailApplicationHandler } from './email.js'

const mockedFileProps = {
  filename: 'file-name.pdf'
}

jest.mock('../../../common/connectors/notify/notify.js')
jest.mock('../../../common/helpers/file/file-utils.js')
jest.mock('../../../common/helpers/email-content/email-content.js', () => ({
  generateEmailContent: jest.fn().mockReturnValue('Case worker email content'),
  getFileProps: jest.fn().mockReturnValue({
    filename: 'file-name.pdf'
  })
}))
jest.mock('../../../common/connectors/sharepoint/sharepoint.js', () => ({
  uploadFile: jest.fn()
}))

const mockFetchFile = /** @type {jest.Mock} */ (fetchFile)
const mockCompressFile = /** @type {jest.Mock} */ (compressFile)

const testEmail = 'test_email@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB-1234-5678'

const emailQuestion = {
  question: 'emailAddress',
  questionKey: 'emailAddress',
  answer: {
    type: 'email',
    value: testEmail,
    displayText: testEmail
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

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }

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

const mockFile = {
  file: 'mock-file',
  contentType: 'application/pdf'
}

describe('emailApplicationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(jest.restoreAllMocks)

  it('should return FILE_TOO_LARGE if file size > 10MB at the point of upload', async () => {
    mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 12 })

    const response = await emailApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )
    expect(response).toEqual({
      error: {
        errorCode: 'FILE_TOO_LARGE',
        statusCode: statusCodes.contentTooLarge
      }
    })
  })

  it('should return FILE_CANNOT_BE_DELIVERED if file size after compression is > 2MB and <= 10MB', async () => {
    const mockFileData = { ...mockFile, fileSizeInMB: 5 }
    mockFetchFile.mockResolvedValue(mockFileData)
    mockCompressFile.mockResolvedValue(mockFileData)

    const response = await emailApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )
    expect(response).toEqual({
      error: {
        errorCode: 'FILE_CANNOT_BE_DELIVERED',
        statusCode: statusCodes.contentTooLarge
      }
    })
  })

  it('should not call compressFile, call getFileProps and include link_to_file if file size is <= 2MB at the point of upload', async () => {
    mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 1 })

    const response = await emailApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )
    expect(mockCompressFile).not.toHaveBeenCalled()
    expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
      content: 'Case worker email content',
      link_to_file: mockedFileProps
    })
    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(response).toBeUndefined()
  })

  it('should call compressFile, call getFileProps and include link_to_file if file size is <= 2MB after compression', async () => {
    mockFetchFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 5 })
    mockCompressFile.mockResolvedValue({ ...mockFile, fileSizeInMB: 1 })

    const response = await emailApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )
    expect(mockCompressFile).toHaveBeenCalled()
    expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
      content: 'Case worker email content',
      link_to_file: mockedFileProps
    })
    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(response).toBeUndefined()
  })

  it('should only call sendEmailToCaseWorker (without link) and sendEmailToApplicant if no biosecurity map provided', async () => {
    const response = await emailApplicationHandler(
      mockRequest,
      testReferenceNumber
    )

    expect(mockFetchFile).not.toHaveBeenCalled()
    expect(mockCompressFile).not.toHaveBeenCalled()
    expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
      content: 'Case worker email content'
    })
    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(response).toBeUndefined()
  })
})
