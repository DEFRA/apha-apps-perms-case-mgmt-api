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
import { config } from '../../../config.js'
import { spyOnConfig } from '../../test-helpers/config.js'

/**
 * @import {TextAnswer, NameAnswer, FileAnswer} from '../../../common/helpers/data-extract/application.js'
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
  createSharepointItem: jest.fn(),
  validateKeyFactsPayload: jest.fn()
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

const testEmail = 'test_email@example.com'
const testFullName = 'Name Surname'
const testReferenceNumber = 'TB-1234-5678'
const sharepointFieldName = 'Application_x0020_Reference_x002'
const testSharepointItem = {
  id: '1',
  webUrl: 'https://sharepoint.example.com'
}

const emailQuestion = {
  question: 'emailAddress',
  questionKey: 'emailAddress',
  /** @type {TextAnswer} */
  answer: {
    type: 'text',
    value: testEmail,
    displayText: testEmail
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
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
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
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
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
      spyOnConfig('featureFlags', {
        sharepointBackupEnabled: false
      })

      mockSendMessageToSQS.mockResolvedValue(undefined)

      const response = await sharePointApplicationHandler(
        mockRequest,
        testReferenceNumber
      )

      expect(sendMessageToSQS).toHaveBeenCalledWith(
        mockRequest.payload,
        testReferenceNumber
      )

      expect(sendEmailToApplicant).toHaveBeenCalledTimes(1)
      expect(sendEmailToApplicant).toHaveBeenCalledWith(
        {
          email: testEmail,
          fullName: 'Name Surname',
          reference: testReferenceNumber
        },
        config.get('notify').tb.applicantConfirmation
      )
      expect(response).toBeUndefined()
    })

    it('should enqueue application for processing and not send the confirmation email', async () => {
      spyOnConfig('featureFlags', {
        sharepointBackupEnabled: true
      })

      mockSendMessageToSQS.mockResolvedValue(undefined)

      const response = await sharePointApplicationHandler(
        mockRequest,
        testReferenceNumber
      )

      expect(sendMessageToSQS).toHaveBeenCalledWith(
        mockRequest.payload,
        testReferenceNumber
      )

      expect(sendEmailToApplicant).not.toHaveBeenCalled()
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

        expect(sendEmailToCaseWorker).toHaveBeenCalledWith(
          {
            content: 'Sharepoint notification email content'
          },
          config.get('notify').tb.caseDelivery
        )
        expect(result).toBeUndefined()
      })

      it('should upload application html and biosecurity map to SharePoint and send emails to applicant and case worker', async () => {
        const mockFileData = { ...mockFile, fileSizeInMB: 5 }
        mockFetchFile.mockResolvedValue(mockFileData)
        mockUploadFile.mockResolvedValue(undefined)

        const response = await processApplication(
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

        expect(sendEmailToCaseWorker).toHaveBeenCalledWith(
          {
            content: 'Sharepoint notification email content'
          },
          config.get('notify').tb.caseDelivery
        )

        expect(response).toBeUndefined()
      })

      it('should throw and log if uploadSubmittedApplication fails', async () => {
        mockUploadFile.mockRejectedValue(new Error('upload failed'))
        await expect(
          processApplication(mockQueuedApplicationDataWithFile)
        ).rejects.toThrow('upload failed')
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload submitted application to SharePoint: upload failed'
        )
        expect(mockUploadFile).toHaveBeenCalledTimes(1)
        expect(mockCreateSharepointItem).not.toHaveBeenCalled()
        expect(mockSendEmailToCaseWorker).not.toHaveBeenCalled()
      })

      it('should throw and log if uploadBiosecurityMap fails', async () => {
        mockUploadFile
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('biosecurity upload failed'))
        await expect(
          processApplication(mockQueuedApplicationDataWithFile)
        ).rejects.toThrow('biosecurity upload failed')
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to upload biosecurity map to SharePoint: biosecurity upload failed'
        )
        expect(mockUploadFile).toHaveBeenCalledTimes(2)
        expect(mockCreateSharepointItem).not.toHaveBeenCalled()
        expect(mockSendEmailToCaseWorker).not.toHaveBeenCalled()
      })

      it('should log if list item already exists and continue processing without creating a sharepoint item', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockGetListItemByFieldValue.mockResolvedValue({
          value: [testSharepointItem]
        })
        const result = await processApplication(mockQueuedApplicationData)

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          `SharePoint item for reference ${testReferenceNumber} already exists, skipping creation.`
        )
        expect(uploadFile).toHaveBeenCalled()
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).not.toHaveBeenCalled()
        expect(sendEmailToCaseWorker).toHaveBeenCalled()
        expect(result).toBeUndefined()
      })

      it('should throw if list item does not exist and createSharepointItem fails', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockGetListItemByFieldValue.mockResolvedValue(null)
        mockCreateSharepointItem.mockRejectedValue(new Error('item failed'))

        await expect(
          processApplication(mockQueuedApplicationData)
        ).rejects.toThrow('item failed')

        expect(uploadFile).toHaveBeenCalled()
        expect(getListItemByFieldValue).toHaveBeenCalled()
        expect(createSharepointItem).toHaveBeenCalled()
        expect(sendEmailToCaseWorker).not.toHaveBeenCalled()
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to create SharePoint item: item failed'
        )
      })

      it('should throw and log if sendCaseworkerNotificationEmail fails', async () => {
        mockUploadFile.mockResolvedValue(undefined)
        mockCreateSharepointItem.mockResolvedValue(testSharepointItem)
        mockSendEmailToCaseWorker.mockRejectedValueOnce(
          new Error('caseworker email failed')
        )
        await expect(
          processApplication(mockQueuedApplicationData)
        ).rejects.toThrow('caseworker email failed')
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          'Failed to send email to case worker: caseworker email failed'
        )
        expect(mockUploadFile).toHaveBeenCalled()
        expect(mockCreateSharepointItem).toHaveBeenCalled()
        expect(mockSendEmailToCaseWorker).toHaveBeenCalled()
      })

      it('should use legacy approach even when keyFacts.biosecurityMaps exists (soft launch)', async () => {
        const mockFileData = { ...mockFile, fileSizeInMB: 5 }
        mockFetchFile.mockResolvedValue(mockFileData)
        mockUploadFile.mockResolvedValue(undefined)

        const biosecurityMapQuestion = {
          question: 'upload-plan',
          questionKey: 'upload-plan',
          /** @type {FileAnswer} */
          answer: {
            type: 'file',
            value: {
              skipped: false,
              path: 'biosecurity-map/legacy-file.pdf'
            },
            displayText: 'legacy-file.pdf'
          }
        }

        const mockApplicationWithBothApproaches = {
          reference: testReferenceNumber,
          application: {
            journeyId:
              'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
            sections: [
              {
                title: 'licence',
                sectionKey: 'licence',
                questionAnswers: [emailQuestion, fullNameQuestion]
              },
              {
                title: 'biosecurity-map',
                sectionKey: 'biosecurity-map',
                questionAnswers: [biosecurityMapQuestion]
              }
            ],
            keyFacts: {
              licenceType: 'TB16',
              movementDirection: 'on',
              requesterCph: '12/345/0000',
              biosecurityMaps: [
                'biosecurity-map/keyfacts-file1.pdf',
                'biosecurity-map/keyfacts-file2.pdf'
              ]
            }
          }
        }

        const response = await processApplication(
          mockApplicationWithBothApproaches
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
        expect(fetchFile).toHaveBeenCalledTimes(1)
        expect(fetchFile).toHaveBeenCalledWith(biosecurityMapQuestion.answer)
        expect(response).toBeUndefined()
      })
    })
  })
})
