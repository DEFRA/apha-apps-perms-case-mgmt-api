import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand
} from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import * as sqs from './sqs.js'
import * as sharepoint from '../../helpers/sharepoint/sharepoint.js'

/**
 * @import {ApplicationData} from '../../helpers/data-extract/data-extract.js'
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

describe('SQS Connector', () => {
  beforeEach(() => {
    sqsMock.reset()
  })

  describe('sendMessageToSQS', () => {
    it('should send a message with the correct body', async () => {
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'abc' })
      await sqs.sendMessageToSQS(applicationData, testReference)

      expect(sqsMock.calls()).toHaveLength(1)

      const command = sqsMock.call(0).args[0]
      expect(command).toBeInstanceOf(SendMessageCommand)

      // @ts-expect-error: input is SendMessageCommandInput in this context
      const body = command.input.MessageBody
      const parsedBody = JSON.parse(body)

      expect(parsedBody.application).toEqual(applicationData)
      expect(parsedBody.reference).toBe(testReference)
    })

    it('should handle errors when sending a message', () => {
      sqsMock.on(SendMessageCommand).rejects(new Error('SQS send error'))

      expect(
        sqs.sendMessageToSQS(applicationData, testReference)
      ).rejects.toThrow('SQS send error')
    })
  })

  describe('pollOnce', () => {
    beforeEach(() => {
      sqsMock.on(ReceiveMessageCommand).resolves({
        Messages: [
          {
            Body: JSON.stringify({
              application: applicationData,
              reference: testReference
            }),
            ReceiptHandle: 'receipt-handle'
          }
        ]
      })
    })

    it('should poll the SQS queue, process messages and delete them if no errors', async () => {
      const mockedProcessApplication = jest
        .spyOn(sharepoint, 'processApplication')
        .mockResolvedValue()

      await sqs.pollOnce()

      expect(sqsMock.calls()).toHaveLength(2)

      expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
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

    it('should log errors when processing fails and not delete the messages', () => {
      const mockedProcessApplication = jest
        .spyOn(sharepoint, 'processApplication')
        .mockRejectedValue(new Error('Processing error'))

      return sqs.pollOnce().catch(() => {
        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0)

        expect(mockedProcessApplication).toHaveBeenCalledWith({
          application: applicationData,
          reference: testReference
        })

        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error processing message from SQS: Processing error`
        )
      })
    })

    it('should log errors when deleting message fails', () => {
      sqsMock.on(DeleteMessageCommand).rejects(new Error('Delete error'))

      return sqs.pollOnce().catch(() => {
        expect(sqsMock.commandCalls(ReceiveMessageCommand)).toHaveLength(1)
        expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1)

        expect(mockLoggerError).toHaveBeenCalledWith(
          'Error deleting message from SQS:',
          expect.any(Error)
        )
      })
    })
  })

  describe('closeSQSClient', () => {
    afterEach(jest.restoreAllMocks)

    it('should close the clients', () => {
      const consumerDestroySpy = jest
        .spyOn(sqs.consumerClient, 'destroy')
        .mockImplementation(() => {})
      const producerDestroySpy = jest
        .spyOn(sqs.producerClient, 'destroy')
        .mockImplementation(() => {})
      sqs.closeSQSClient()
      expect(consumerDestroySpy).toHaveBeenCalled()
      expect(producerDestroySpy).toHaveBeenCalled()
    })
  })
})
