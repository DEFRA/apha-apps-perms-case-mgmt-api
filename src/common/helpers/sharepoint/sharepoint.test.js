import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../../common/connectors/notify/notify.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { generateHtmlBuffer } from '../../../common/helpers/export/export-html.js'
import { fetchFile } from '../../../common/helpers/file/file-utils.js'
import {
  getListItemByFieldValue,
  uploadFile
} from '../../../common/connectors/sharepoint/sharepoint.js'
import {
  processApplication,
  sharePointApplicationHandler
} from './sharepoint.js'
import { sendMessageToSQS } from '../../connectors/queue/sqs-producer.js'
import { createSharepointItem } from './sharepoint-item.js'

/**
 * @import {TextAnswer, NameAnswer, FileAnswer} from '../../../common/helpers/data-extract/data-extract.js'
 */

jest.mock('../../../common/connectors/notify/notify.js')
jest.mock('../../../common/helpers/file/file-utils.js', () => ({
  fetchFile: jest.fn(),
  getFileExtension: jest.fn().mockReturnValue('pdf')
}))
jest.mock('../../../common/helpers/email-content/email-content.js', () => ({
  generateEmailContent: jest.fn().mockReturnValue('Case worker email content'),
  generateSharepointNotificationContent: jest
    .fn()
    .mockReturnValue('Sharepoint notification email content')
}))
jest.mock('../../../common/helpers/export/export-html.js', () => ({
  generateHtmlBuffer: jest
    .fn()
    .mockReturnValue(Buffer.from('<html>Mock HTML</html>'))
}))
jest.mock('../../../common/connectors/sharepoint/sharepoint.js', () => ({
  uploadFile: jest.fn(),
  getListItemUrl: jest
    .fn()
    .mockReturnValue('https://sharepoint.example.com/item'),
  getListItemByFieldValue: jest.fn()
}))
jest.mock('./sharepoint-item.js', () => ({
  createSharepointItem: jest.fn()
}))
jest.mock('../../connectors/queue/sqs-producer.js', () => ({
  sendMessageToSQS: jest.fn()
}))

const mockLoggerInfo = jest.fn()
const mockLoggerError = jest.fn()
const mockLoggerWarn = jest.fn()
jest.mock('../logging/logger.js', () => ({
  createLogger: () => ({
    error: (...args) => mockLoggerError(...args),
    info: (...args) => mockLoggerInfo(...args),
    warn: (...args) => mockLoggerWarn(...args)
  })
}))

const mockFetchFile = /** @type {jest.Mock} */ (fetchFile)
const mockGenerateHtmlBuffer = /** @type {jest.Mock} */ (generateHtmlBuffer)
const mockUploadFile = /** @type {jest.Mock} */ (uploadFile)
const mockGetListItemByFieldValue = /** @type {jest.Mock} */ (
  getListItemByFieldValue
)
const mockSendMessageToSQS = /** @type {jest.Mock} */ (sendMessageToSQS)
const mockCreateSharepointItem = /** @type {jest.Mock} */ (createSharepointItem)
const mockSendEmailToCaseWorker = /** @type {jest.Mock} */ (
  sendEmailToCaseWorker
)

const testEmail = 'test@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB-1234-5678'
const sharepointFieldName = 'Application_x0020_Reference_x002'

const emailQuestion = {
  question: 'emailAddress',
  questionKey: 'emailAddress',
  /** @type {TextAnswer} */
  answer: {
    type: 'text',
    value: 'test@example.com',
    displayText: 'test@example.com'
  }
}
const fullNameQuestion = {
  question: 'fullName',
  questionKey: 'fullName',
  /** @type {NameAnswer} */
  answer: {
    type: 'name',
    value: { firstName: 'Name', lastName: 'Surname' },
    displayText: testFullName
  }
}
const fileQuestion = {
  question: 'upload-plan',
  questionKey: 'upload-plan',
  /** @type {FileAnswer} */
  answer: {
    type: 'file',
    value: {
      skipped: false,
      path: 'file.pdf'
    },
    displayText: 'file.pdf'
  }
}

const mockRequest = {
  payload: {
    sections: [
      {
        title: 'licence',
        sectionKey: 'licence',
        questionAnswers: [emailQuestion, fullNameQuestion]
      }
    ]
  }
}

const mockRequestWithFile = {
  payload: {
    sections: [
      {
        title: 'licence',
        sectionKey: 'licence',
        questionAnswers: [emailQuestion, fullNameQuestion]
      },
      {
        title: 'biosecurity-map',
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

describe('SharePoint Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(jest.restoreAllMocks)

  describe('sharePointApplicationHandler', () => {
    it('should enqueue application for processing and send email to applicant', async () => {
      mockSendMessageToSQS.mockResolvedValue(undefined)

      const response = await sharePointApplicationHandler(
        mockRequest,
        testReferenceNumber
      )

      expect(sendMessageToSQS).toHaveBeenCalledWith(
        mockRequest.payload,
        testReferenceNumber
      )
      expect(sendEmailToApplicant).toHaveBeenCalledWith({
        email: testEmail,
        fullName: 'Name Surname',
        reference: testReferenceNumber
      })
      expect(response).toBeUndefined()
    })

    it('should return MESSAGE_ENQUEUEING_FAILED if sendMessageToSQS fails and not send email to applicant', async () => {
      mockSendMessageToSQS.mockRejectedValue(new Error('SQS error'))

      const response = await sharePointApplicationHandler(
        mockRequest,
        testReferenceNumber
      )

      expect(response).toEqual({
        error: {
          errorCode: 'MESSAGE_ENQUEUEING_FAILED',
          statusCode: statusCodes.serverError
        }
      })
      expect(sendEmailToApplicant).not.toHaveBeenCalled()
    })
  })

  describe('processApplication', () => {
    const mockQueuedApplicationData = {
      reference: testReferenceNumber,
      application: mockRequest.payload
    }
    const mockQueuedApplicationDataWithFile = {
      reference: testReferenceNumber,
      application: mockRequestWithFile.payload
    }

    describe('processApplication', () => {
      beforeEach(() => {
        const mockFileData = { ...mockFile, fileSizeInMB: 5 }
        mockFetchFile.mockResolvedValue(mockFileData)
      })

      it('should upload application html to SharePoint, create item in list and send email to case worker', async () => {
        mockUploadFile.mockResolvedValue(undefined)

        const result = await processApplication(mockQueuedApplicationData)

        expect(mockGenerateHtmlBuffer).toHaveBeenCalledWith(
          mockRequest.payload,
          testReferenceNumber
        )
        expect(uploadFile).toHaveBeenCalledWith(
          testReferenceNumber,
          `${testReferenceNumber}_Submitted_Application.html`,
          Buffer.from('<html>Mock HTML</html>')
        )
        expect(getListItemByFieldValue).toHaveBeenCalledWith(
          sharepointFieldName,
          testReferenceNumber
        )
        expect(createSharepointItem).toHaveBeenCalledWith(
          mockRequest.payload,
          testReferenceNumber
        )

        expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
          content: 'Sharepoint notification email content'
        })
        expect(result).toBe(true)
      })

      it('should upload application html and biosecurity map to SharePoint and send emails to applicant and case worker', async () => {
        const mockFileData = { ...mockFile, fileSizeInMB: 5 }
        mockFetchFile.mockResolvedValue(mockFileData)
        mockUploadFile.mockResolvedValue(undefined)

        const result = await processApplication(
          mockQueuedApplicationDataWithFile
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
          `${testReferenceNumber}_Biosecurity_Map.pdf`,
          mockFileData.file
        )

        expect(getListItemByFieldValue).toHaveBeenCalledWith(
          sharepointFieldName,
          testReferenceNumber
        )
        expect(createSharepointItem).toHaveBeenCalledWith(
          mockRequestWithFile.payload,
          testReferenceNumber
        )

        expect(sendEmailToCaseWorker).toHaveBeenCalledWith({
          content: 'Sharepoint notification email content'
        })

        expect(result).toBe(true)
      })

      it('should log if uploadSubmittedApplication fails because file was already uploaded, continue processing and return true', async () => {
        mockUploadFile.mockRejectedValueOnce({
          message: 'file already exists',
          statusCode: statusCodes.conflict
        })
        const result = await processApplication(
          mockQueuedApplicationDataWithFile
        )

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload submitted application to SharePoint: file already exists'
        )
        expect(uploadFile).toHaveBeenCalledTimes(2)
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should log if uploadSubmittedApplication fails for any other reason, continue processing and return false', async () => {
        mockUploadFile.mockRejectedValueOnce(new Error('upload failed'))

        const result = await processApplication(
          mockQueuedApplicationDataWithFile
        )

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload submitted application to SharePoint: upload failed'
        )
        expect(uploadFile).toHaveBeenCalledTimes(2)
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(false)
      })

      it('should log if uploadBiosecurityMap fails because file was already uploaded, continue processing and return true', async () => {
        mockUploadFile.mockResolvedValueOnce(undefined).mockRejectedValueOnce({
          message: 'file already exists',
          statusCode: statusCodes.conflict
        })

        const result = await processApplication(
          mockQueuedApplicationDataWithFile
        )

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload biosecurity map to SharePoint: file already exists'
        )
        expect(uploadFile).toHaveBeenCalledTimes(2)
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should log if uploadBiosecurityMap fails for any other reason, continue processing and return false', async () => {
        mockUploadFile
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('biosecurity upload failed'))

        const result = await processApplication(
          mockQueuedApplicationDataWithFile
        )

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload biosecurity map to SharePoint: biosecurity upload failed'
        )
        expect(uploadFile).toHaveBeenCalledTimes(2)
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(false)
      })

      it('should log if list item already exists, continue processing without creating a sharepoint item and return true', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockGetListItemByFieldValue.mockResolvedValue({
          value: [
            {
              id: '1',
              webUrl: 'https://sharepoint.example.com'
            }
          ]
        })
        const result = await processApplication(mockQueuedApplicationData)

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          `SharePoint item for reference ${testReferenceNumber} already exists, skipping creation.`
        )
        expect(uploadFile).toHaveBeenCalled()
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).not.toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should log if list item does not exist and createSharepointItem fails, continue processing and return false', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockGetListItemByFieldValue.mockResolvedValue(null)
        mockCreateSharepointItem.mockRejectedValue(new Error('item failed'))

        const result = await processApplication(mockQueuedApplicationData)

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to create SharePoint item: item failed'
        )
        expect(uploadFile).toHaveBeenCalled()
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(false)
      })

      it('should log if sendCaseworkerNotificationEmail fails and return false in any case', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockGetListItemByFieldValue.mockResolvedValue(null)
        mockCreateSharepointItem.mockResolvedValue({
          id: '1',
          webUrl: 'https://sharepoint.example.com'
        })
        mockSendEmailToCaseWorker.mockRejectedValueOnce(
          new Error('caseworker email failed')
        )
        const result = await processApplication(mockQueuedApplicationData)

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to send email to case worker: caseworker email failed'
        )
        expect(uploadFile).toHaveBeenCalled()
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBe(false)
      })
    })
  })
})
