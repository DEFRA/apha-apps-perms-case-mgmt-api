import { S3Client } from '@aws-sdk/client-s3'
import { config } from '../../config.js'

const { region, s3Endpoint } = config.get('aws')

const s3Client = {
  plugin: {
    name: 's3Client',
    version: '0.1.0',
    register(server, options) {
      const client = new S3Client({
        region: options.region,
        endpoint: options.endpoint,
        forcePathStyle: options.isDevelopment
      })

      server.decorate('request', 's3', client)
      server.decorate('server', 's3', client)

      server.events.on('stop', () => {
        server.logger.info(`Closing S3 client`)
        client.destroy()
      })
    }
  },
  options: {
    region,
    endpoint: s3Endpoint,
    isDevelopment: config.get('isDevelopment')
  }
}

export { s3Client }
