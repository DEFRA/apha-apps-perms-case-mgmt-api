import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import * as sqs from './sqs-consumer.js'
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

describe('SQS Consumer Connector', () => {
  beforeEach(() => {
    sqsMock.reset()
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
        .mockResolvedValue(true)

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
        .mockRejectedValue(false)

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
