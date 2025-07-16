import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import * as sqs from './sqs-producer.js'

/**
 * @import {ApplicationData} from '../../helpers/data-extract/data-extract.js'
 */

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

describe('SQS Producer Connector', () => {
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

  describe('closeSQSClient', () => {
    afterEach(jest.restoreAllMocks)

    it('should close the client', () => {
      const producerDestroySpy = jest
        .spyOn(sqs.producerClient, 'destroy')
        .mockImplementation(() => {})
      sqs.closeSQSProducerClient()
      expect(producerDestroySpy).toHaveBeenCalled()
    })
  })
})
