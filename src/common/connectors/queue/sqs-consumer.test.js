import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import * as sqs from './sqs-consumer.js'
import * as sharepoint from '../../helpers/sharepoint/sharepoint.js'
import * as caseManagement from '../../helpers/case-management/case-management.js'
import { spyOnConfig } from '../../test-helpers/config.js'
import { createApplication } from '../../helpers/data-extract/data-extract.js'

/**
 * @import {ApplicationData} from '../../helpers/data-extract/application.js'
 * @import {Agent} from 'node:https'
 */

const mockLoggerInfo = jest.fn()
const mockLoggerError = jest.fn()
jest.mock('../../helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))

const sqsMock = mockClient(SQSClient)

const testReference = 'TB-AAAA-BBBB'
/** @type {ApplicationData} */
const applicationData = {
  journeyId: 'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
  sections: [
    {
      title: 'Section 1',
      sectionKey: 's1',
      questionAnswers: [
        {
          question: 'Question 1',
          questionKey: 'q1',
          answer: { type: 'text', value: 'Answer 1', displayText: 'Answer 1' }
        }
      ]
    }
  ]
}
const expectedApplication = createApplication(applicationData)

const sqsMessage = {
  Body: JSON.stringify({
    application: applicationData,
    reference: testReference
  }),
  ReceiptHandle: 'receipt-handle'
}

describe('SQS Consumer Connector', () => {
  let mockedSharepoint
  let mockedCaseManagement

  beforeEach(() => {
    sqsMock.reset()
    jest.clearAllMocks()
    mockedSharepoint = jest
      .spyOn(sharepoint, 'processApplication')
      .mockResolvedValue()
    mockedCaseManagement = jest
      .spyOn(caseManagement, 'processApplication')
      .mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('consumerClient', () => {
    it('should use the a custom httpsAgent', async () => {
      const config =
        // @ts-ignore
        await sqs.consumerClient.config.requestHandler.configProvider

      const httpsAgent = /** @type {Agent} */ (config.httpsAgent)

      expect(httpsAgent.maxSockets).toBe(50)
      expect(httpsAgent.options.keepAlive).toBe(true)
      expect(httpsAgent.options.keepAliveMsecs).toBe(1000)
    })
  })

  describe('pollOnce', () => {
    describe('when only one message is received', () => {
      beforeEach(() => {
        sqsMock.on(ReceiveMessageCommand).resolves({
          Messages: [sqsMessage]
        })
      })

      it('should poll with the right config, process SharePoint and delete the message', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        await sqs.pollOnce()

        expect(sqsMock.calls()).toHaveLength(2)

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)

        const visibilityTimeout = sqsMock.commandCalls(ReceiveMessageCommand)[0]
          .args[0].input.VisibilityTimeout
        expect(typeof visibilityTimeout).toBe('number')
        expect(visibilityTimeout).toBeGreaterThanOrEqual(120)
        expect(visibilityTimeout).toBeLessThanOrEqual(180)

        const maxNumberOfMessages = sqsMock.commandCalls(
          ReceiveMessageCommand
        )[0].args[0].input.MaxNumberOfMessages
        expect(typeof maxNumberOfMessages).toBe('number')
        expect(maxNumberOfMessages).toBe(5)

        const WaitTimeSeconds = sqsMock.commandCalls(ReceiveMessageCommand)[0]
          .args[0].input.WaitTimeSeconds
        expect(typeof WaitTimeSeconds).toBe('number')
        expect(WaitTimeSeconds).toBe(10)

        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expectedApplication,
          testReference
        )

        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application processed successfully into Sharepoint: ${testReference}`
        )
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application deleted from the queue: ${testReference}`
        )
      })

      it('should process Case Management and delete the message when it is the only integration enabled', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: false,
          caseManagementIntegrationEnabled: true
        })
        await sqs.pollOnce()

        expect(mockedSharepoint).not.toHaveBeenCalled()
        expect(mockedCaseManagement).toHaveBeenCalledWith(
          expectedApplication,
          testReference
        )
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)
      })

      it('should process both integrations and delete the message when both are enabled', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: true
        })
        await sqs.pollOnce()

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expect.anything(),
          testReference
        )
        expect(mockedCaseManagement).toHaveBeenCalledWith(
          expect.anything(),
          testReference
        )
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)
      })

      it('should delete the message without processing integrations when both are disabled', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: false,
          caseManagementIntegrationEnabled: false
        })
        await sqs.pollOnce()

        expect(mockedSharepoint).not.toHaveBeenCalled()
        expect(mockedCaseManagement).not.toHaveBeenCalled()
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)
      })

      it('should log errors when processing fails and not delete the messages', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        mockedSharepoint.mockRejectedValue(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0)

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expectedApplication,
          testReference
        )

        expect(mockLoggerError).toHaveBeenCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing application into SharePoint: Error: Processing error`
        )
      })

      it('should log errors when deleting message fails', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        sqsMock.on(DeleteMessageCommand).rejects('Delete error')

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockLoggerError).toHaveBeenCalledWith(
          'Error deleting message from SQS: Error: Delete error'
        )
      })
    })
    describe('when multiple messages are received', () => {
      beforeEach(() => {
        sqsMock.on(ReceiveMessageCommand).resolves({
          Messages: [sqsMessage, sqsMessage]
        })
      })

      it('should poll multiple messages from SQS queue, process messages and delete them if no errors', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        await sqs.pollOnce()

        expect(sqsMock.calls()).toHaveLength(3)
        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(2)

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expectedApplication,
          testReference
        )

        expect(mockLoggerInfo).toHaveBeenCalledTimes(4)
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application processed successfully into Sharepoint: ${testReference}`
        )
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application deleted from the queue: ${testReference}`
        )
      })

      it('should log errors when processing fails and not delete the messages', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        mockedSharepoint.mockRejectedValue(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0)

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expectedApplication,
          testReference
        )

        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing application into SharePoint: Error: Processing error`
        )
      })

      it('should log single message when processing one message fails and not delete that message', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        mockedSharepoint
          .mockResolvedValueOnce()
          .mockRejectedValueOnce(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockedSharepoint).toHaveBeenCalledWith(
          expect.anything(),
          testReference
        )

        expect(mockLoggerError).toHaveBeenCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing application into SharePoint: Error: Processing error`
        )
      })

      it('should log errors when deleting message fails', async () => {
        spyOnConfig('featureFlags', {
          sharepointIntegrationEnabled: true,
          caseManagementIntegrationEnabled: false
        })
        sqsMock.on(DeleteMessageCommand).rejects('Delete error')

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(2)

        expect(mockLoggerError).toHaveBeenCalledTimes(2)
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Error deleting message from SQS: Error: Delete error'
        )
      })
    })

    describe('closeSQSConsumerClient', () => {
      afterEach(jest.restoreAllMocks)

      it('should close the client', () => {
        const consumerDestroySpy = jest
          .spyOn(sqs.consumerClient, 'destroy')
          .mockImplementation(() => {})
        sqs.closeSQSConsumerClient()
        expect(consumerDestroySpy).toHaveBeenCalled()
      })
    })
  })
})
