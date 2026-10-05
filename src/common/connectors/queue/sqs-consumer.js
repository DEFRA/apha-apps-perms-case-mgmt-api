import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand
} from '@aws-sdk/client-sqs'
import { config } from '../../../config.js'
import { processApplication as processApplicationSharepoint } from '../../helpers/sharepoint/sharepoint.js'
import { processApplication as processApplicationCaseManagement } from '../../helpers/case-management/case-management.js'
import { createLogger } from '../../helpers/logging/logger.js'
import { Agent } from 'node:https'
import CacheableLookup from 'cacheable-lookup'
import { createApplication } from '../../helpers/data-extract/data-extract.js'

/** @import {QueuedApplication} from '../../helpers/queue/queue.js' */

const retryTimeout = 5000 // 5 seconds

const logger = createLogger()

const cachedDns = new CacheableLookup()
const httpsAgent = new Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 1000
})
cachedDns.install(httpsAgent)

/**
 * @import {Message} from '@aws-sdk/client-sqs'
 */

const { region, sqsEndpoint, sqsQueueUrl, sqsMaxNumberOfMessages } =
  config.get('aws')
export const consumerClient = new SQSClient({
  region,
  endpoint: sqsEndpoint,
  requestHandler: {
    httpsAgent
  }
})

export const pollOnce = async () => {
  // Calculate visibility timeout: 2 minutes + random jitter (0-60 seconds)
  const baseTimeout = 120
  const jitterMaxSeconds = 61
  const jitter = Math.floor(Math.random() * jitterMaxSeconds)
  const visibilityTimeout = baseTimeout + jitter

  const command = new ReceiveMessageCommand({
    QueueUrl: sqsQueueUrl,
    MaxNumberOfMessages: sqsMaxNumberOfMessages,
    WaitTimeSeconds: 10, // Long poll
    VisibilityTimeout: visibilityTimeout
  })

  const response = await consumerClient.send(command)
  return Promise.allSettled(
    response.Messages?.map(processApplicationAndAcknowledge) || []
  )
}

/**
 * Starts polling an AWS SQS queue for messages in an infinite loop.
 * @returns {Promise<void>} Resolves when the polling loop is stopped (never in current implementation).
 */
export const startSQSQueuePolling = async (limit = Infinity) => {
  let count = 0
  while (count < limit) {
    try {
      await pollOnce()
    } catch (error) {
      logger.error(`Error in SQS polling loop: ${error}`)
      // add a delay to avoid tight loop in case of errors
      await new Promise((resolve) => setTimeout(resolve, retryTimeout))
    }
    count++
  }
}

export const closeSQSConsumerClient = () => consumerClient.destroy()

/**
 * @param {Message} message
 */
const processApplicationAndAcknowledge = async (message) => {
  if (!message?.Body) {
    return
  }

  let queuedApplicationData
  let application
  try {
    queuedApplicationData = /** @type {QueuedApplication} */ (
      JSON.parse(message.Body)
    )
    application = createApplication(queuedApplicationData.application)
  } catch (error) {
    logger.error(`Error processing message from SQS: ${error}`)
    return
  }

  const featureFlags = config.get('featureFlags')
  const reference = queuedApplicationData.reference
  let processingFailed = false

  if (featureFlags.sharepointIntegrationEnabled) {
    try {
      await processApplicationSharepoint(application, reference)
      logger.info(
        `Application processed successfully into Sharepoint: ${reference}`
      )
    } catch (error) {
      processingFailed = true
      logger.error(`Error processing application into SharePoint: ${error}`)
    }
  }
  if (featureFlags.caseManagementIntegrationEnabled) {
    try {
      await processApplicationCaseManagement(application, reference)
      logger.info(
        `Application processed successfully into Case Management: ${reference}`
      )
    } catch (error) {
      processingFailed = true
      logger.error(
        `Error processing application into Case Management: ${error}`
      )
    }
  }

  if (processingFailed) {
    return
  }

  try {
    await deleteMessageFromSQS(message)
    logger.info(`Application deleted from the queue: ${reference}`)
  } catch (error) {
    logger.error(`Error deleting message from SQS: ${error}`)
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
