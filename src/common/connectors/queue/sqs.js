import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand
} from '@aws-sdk/client-sqs'
import { config } from '../../../config.js'
import { processApplication } from '../../helpers/sharepoint/sharepoint.js'
import { createLogger } from '../../helpers/logging/logger.js'

const logger = createLogger()

/**
 * @import {ApplicationData} from '../../helpers/data-extract/data-extract.js'
 * @import {Message} from '@aws-sdk/client-sqs'
 */

const { region, sqsEndpoint, sqsQueueUrl, accessKeyId, secretAccessKey } =
  config.get('aws')
export const producerClient = new SQSClient({
  region,
  endpoint: sqsEndpoint,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})
export const consumerClient = new SQSClient({
  region,
  endpoint: sqsEndpoint,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
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

export const pollOnce = async () => {
  const command = new ReceiveMessageCommand({
    QueueUrl: sqsQueueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10, // Long poll
    VisibilityTimeout: 30
  })

  const response = await consumerClient.send(command)
  const message = response.Messages?.[0]
  if (message?.Body) {
    try {
      const queuedApplicationData = JSON.parse(message.Body)
      await processApplication(queuedApplicationData)
      logger.info(
        `Application processed successfully: ${queuedApplicationData.reference}`
      )
      try {
        await deleteMessageFromSQS(message)
        logger.info(
          `Application deleted from the queue: ${queuedApplicationData.reference}`
        )
      } catch (error) {
        logger.error('Error deleting message from SQS:', error)
      }
    } catch (error) {
      logger.error('Error processing message from SQS:', error)
    }
  }
}

/**
 * Starts polling an AWS SQS queue for messages in an infinite loop.
 * @returns {Promise<void>} Resolves when the polling loop is stopped (never in current implementation).
 */
export const startSQSQueuePolling = async () => {
  while (true) {
    try {
      await pollOnce()
    } catch (error) {
      logger.error('Error in SQS polling loop:', error)
      // add a delay to avoid tight loop in case of errors
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

/**
 * @param {Message} message
 * @returns {Promise<void>}
 */
const deleteMessageFromSQS = async (message) => {
  const deleteCommand = new DeleteMessageCommand({
    QueueUrl: sqsQueueUrl,
    ReceiptHandle: message.ReceiptHandle
  })
  await consumerClient.send(deleteCommand)
}

export const closeSQSClient = () => {
  if (consumerClient) {
    consumerClient.destroy()
  }
  if (producerClient) {
    producerClient.destroy()
  }
}
