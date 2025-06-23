import { config } from '../../config.js'

import { createServer } from '../../server.js'
import {
  closeSQSClient,
  startSQSQueuePolling
} from '../connectors/queue/sqs.js'
import { closeS3Client } from '../connectors/storage/s3.js'
import { createLogger } from './logging/logger.js'

async function startServer() {
  let server

  try {
    server = await createServer()
    await server.start()

    server.logger.info('Server started successfully')
    server.logger.info(
      `Access your backend on http://localhost:${config.get('port')}`
    )

    if (config.get('featureFlags').sharepointIntegrationEnabled) {
      startSQSQueuePolling()
      server.logger.info('SQS queue polling started')

      server.events.on('stop', () => {
        server.logger.info(`Closing SQS client`)
        closeSQSClient()
      })
    }

    server.events.on('stop', () => {
      server.logger.info(`Closing S3 client`)
      closeS3Client()
    })
  } catch (error) {
    const logger = createLogger()
    logger.info('Server failed to start :(')
    logger.error(error)
  }

  return server
}

export { startServer }
