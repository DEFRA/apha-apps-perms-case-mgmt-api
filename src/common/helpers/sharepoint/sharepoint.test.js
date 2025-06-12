import { sendEmailToApplicant } from '../../../common/connectors/notify/notify.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { generateHtmlBuffer } from '../../../common/helpers/export/export-html.js'
import { fetchFile } from '../../../common/helpers/file/file-utils.js'
import { uploadFile } from '../../../common/connectors/sharepoint/sharepoint.js'
import { sharePointApplicationHandler } from './sharepoint.js'

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
jest.mock('../../../common/helpers/export/export-html.js', () => ({
  generateHtmlBuffer: jest
    .fn()
    .mockReturnValue(Buffer.from('<html>Mock HTML</html>'))
}))
jest.mock('../../../common/connectors/sharepoint/sharepoint.js', () => ({
  uploadFile: jest.fn()
}))

const mockFetchFile = /** @type {jest.Mock} */ (fetchFile)
const mockGenerateHtmlBuffer = /** @type {jest.Mock} */ (generateHtmlBuffer)
const mockUploadFile = /** @type {jest.Mock} */ (uploadFile)

const testEmail = 'test@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB-1234-5678'

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

describe('sharePointApplicationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should upload application html to SharePoint and send email to applicant', async () => {
    mockUploadFile.mockResolvedValue(undefined)

    const response = await sharePointApplicationHandler(
      mockRequest,
      testReferenceNumber
    )

    expect(mockGenerateHtmlBuffer).toHaveBeenCalledWith(
      mockRequest.payload,
      testReferenceNumber
    )
    expect(uploadFile).toHaveBeenCalledWith(
      testReferenceNumber,
      `${testReferenceNumber}_Submitted_Application.html`,
      Buffer.from('<html>Mock HTML</html>')
    )

    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(response).toBeUndefined()
  })

  it('should upload application html and biosecurity map to SharePoint and send email to applicant', async () => {
    const mockFileData = { ...mockFile, fileSizeInMB: 5 }
    mockFetchFile.mockResolvedValue(mockFileData)
    mockUploadFile.mockResolvedValue(undefined)

    const response = await sharePointApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )

    expect(mockGenerateHtmlBuffer).toHaveBeenCalledWith(
      mockRequestWithFile.payload,
      testReferenceNumber
    )
    expect(uploadFile).toHaveBeenCalledTimes(2)
    expect(uploadFile).toHaveBeenNthCalledWith(
      1,
      testReferenceNumber,
      `${testReferenceNumber}_Submitted_Application.html`,
      Buffer.from('<html>Mock HTML</html>')
    )
    expect(uploadFile).toHaveBeenNthCalledWith(
      2,
      testReferenceNumber,
      mockedFileProps.filename,
      mockFileData.file
    )

    expect(sendEmailToApplicant).toHaveBeenCalledWith({
      email: testEmail,
      fullName: testFullName,
      reference: testReferenceNumber
    })
    expect(sendEmailToApplicant).toHaveBeenCalledTimes(1)

    expect(response).toBeUndefined()
  })

  it('should return FILE_UPLOAD_FAILED__APPLICATION if that uploadFile step fails', async () => {
    mockUploadFile.mockRejectedValue(new Error('upload failed'))

    const response = await sharePointApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )

    expect(uploadFile).toHaveBeenCalled()
    expect(response).toEqual({
      error: {
        errorCode: 'FILE_UPLOAD_FAILED__APPLICATION',
        statusCode: statusCodes.serverError
      }
    })
  })

  it('should return FILE_UPLOAD_FAILED__BIOSECURITY_MAP if that uploadFile step fails', async () => {
    const mockFileData = { ...mockFile, fileSizeInMB: 5 }
    mockFetchFile.mockResolvedValue(mockFileData)
    mockUploadFile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('upload failed'))

    const response = await sharePointApplicationHandler(
      mockRequestWithFile,
      testReferenceNumber
    )

    expect(uploadFile).toHaveBeenCalled()
    expect(response).toEqual({
      error: {
        errorCode: 'FILE_UPLOAD_FAILED__BIOSECURITY_MAP',
        statusCode: statusCodes.serverError
      }
    })
  })
})
