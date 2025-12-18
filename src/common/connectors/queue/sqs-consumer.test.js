import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import * as sqs from './sqs-consumer.js'
import * as sharepoint from '../../helpers/sharepoint/sharepoint.js'

/**
 * @import {ApplicationData} from '../../helpers/data-extract/application.js'
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

const sqsMessage = {
  Body: JSON.stringify({
    application: applicationData,
    reference: testReference
  }),
  ReceiptHandle: 'receipt-handle'
}

describe('SQS Consumer Connector', () => {
  beforeEach(() => {
    sqsMock.reset()
  })

  describe('pollOnce', () => {
    describe('when only one message is received', () => {
      beforeEach(() => {
        sqsMock.on(ReceiveMessageCommand).resolves({
          Messages: [sqsMessage]
        })
      })

      it('should poll the SQS queue with the right visibility timeout and max messages, process messages and delete them if no errors', async () => {
        const mockedProcessApplication = jest
          .spyOn(sharepoint, 'processApplication')
          .mockResolvedValue()

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

        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application processed successfully: ${testReference}`
        )
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application deleted from the queue: ${testReference}`
        )
      })

      it('should log errors when processing fails and not delete the messages', async () => {
        const mockedProcessApplication = jest
          .spyOn(sharepoint, 'processApplication')
          .mockRejectedValue(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerError).toHaveBeenCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing message from SQS: Error: Processing error`
        )
      })

      it('should log errors when deleting message fails', async () => {
        jest.spyOn(sharepoint, 'processApplication').mockResolvedValue()
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
        const mockedProcessApplication = jest
          .spyOn(sharepoint, 'processApplication')
          .mockResolvedValue()

        await sqs.pollOnce()

        expect(sqsMock.calls()).toHaveLength(3)
        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(2)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerInfo).toHaveBeenCalledTimes(4)
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application processed successfully: ${testReference}`
        )
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          `Application deleted from the queue: ${testReference}`
        )
      })

      it('should log errors when processing fails and not delete the messages', async () => {
        const mockedProcessApplication = jest
          .spyOn(sharepoint, 'processApplication')
          .mockRejectedValue(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing message from SQS: Error: Processing error`
        )
      })

      it('should log single message when processing one message fails and not delete that message', async () => {
        const mockedProcessApplication = jest
          .spyOn(sharepoint, 'processApplication')
          .mockResolvedValueOnce()
          .mockRejectedValueOnce(new Error('Processing error'))

        await sqs.pollOnce()

        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerError).toHaveBeenCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing message from SQS: Error: Processing error`
        )
      })

      it('should log errors when deleting message fails', async () => {
        jest.spyOn(sharepoint, 'processApplication').mockResolvedValue()
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
