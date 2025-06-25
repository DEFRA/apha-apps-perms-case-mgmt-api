import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { config } from '../../../config.js'

/**
 * @import {ApplicationData} from '../../helpers/data-extract/data-extract.js'
 * @import {Message} from '@aws-sdk/client-sqs'
 */

const { region, sqsEndpoint, sqsQueueUrl } = config.get('aws')
export const producerClient = new SQSClient({
  region,
  endpoint: sqsEndpoint
})

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @returns {Promise<void>} Resolves when the message has been sent or logs an error if sending fails.
 */
export const sendMessageToSQS = async (application, reference) => {
  const command = new SendMessageCommand({
    QueueUrl: sqsQueueUrl,
    MessageBody: JSON.stringify({ application, reference })
  })
  await producerClient.send(command)
}

export const closeSQSProducerClient = () => producerClient.destroy()
