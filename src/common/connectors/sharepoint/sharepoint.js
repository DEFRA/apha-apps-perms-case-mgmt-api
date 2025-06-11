import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js'
import { config } from '../../../config.js'
import { createLogger } from '../../helpers/logging/logger.js'

const logger = createLogger()

const { tenantId, clientId, clientSecret } = config.get('sharepoint')

logger.info('tenantId', tenantId)
logger.info('clientId', clientId)
logger.info(
  'clientSecret',
  clientSecret
    ? clientSecret.slice(0, 4) + '...' + clientSecret.slice(-4)
    : '[NOT SET]'
)

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
logger.info('Created ClientSecretCredential instance')

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default']
})
logger.info('Created TokenCredentialAuthenticationProvider instance')

const graphClient = Client.initWithMiddleware({ authProvider })
logger.info('Initialized Microsoft Graph client')

/**
 * @param {string} reference
 * @param {string} fileName
 * @param {Uint8Array<ArrayBufferLike>} file
 * @returns {Promise<object>}
 */
export async function uploadFile(reference, fileName, file) {
  const { driveId, folderPath } = config.get('sharepoint')

  logger.info('driveId', driveId)
  logger.info('folderPath', folderPath)
  logger.info(
    'url',
    `/drives/${driveId}/items/root:/${folderPath}/${reference}/${fileName}:/content`
  )

  return graphClient
    .api(
      `/drives/${driveId}/items/root:/${folderPath}/${reference}/${fileName}:/content`
    )
    .put(file)
}
