import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js'
import { config } from '../../../config.js'

/**
 * @param {string} reference
 * @param {string} fileName
 * @param {Uint8Array<ArrayBufferLike>} file
 * @returns {Promise<object>}
 */
export async function uploadFile(reference, fileName, file) {
  const { tenantId, clientId, clientSecret, driveId, folderPath } =
    config.get('sharepoint')

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  })

  const graphClient = Client.initWithMiddleware({ authProvider })
  return graphClient
    .api(
      `/drives/${driveId}/items/root:/${folderPath}/${reference}/${fileName}:/content`
    )
    .put(file)
}
