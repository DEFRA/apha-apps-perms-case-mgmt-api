import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/lib/src/authentication/azureTokenCredentials/TokenCredentialAuthenticationProvider.js'
import { config } from '../../../config.js'

const { tenantId, clientId, clientSecret } = config.get('sharepoint')

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default']
})

const graphClient = Client.initWithMiddleware({ authProvider })

/**
 * @param {string} reference
 * @param {string} fileName
 * @param {Uint8Array<ArrayBufferLike>} file
 * @returns {Promise<object>}
 */
export async function uploadFile(reference, fileName, file) {
  const { driveId, folderPath } = config.get('sharepoint')

  return graphClient
    .api(
      `/drives/${driveId}/items/root:/${folderPath}/${reference}/${fileName}:/content`
    )
    .put(file)
}
