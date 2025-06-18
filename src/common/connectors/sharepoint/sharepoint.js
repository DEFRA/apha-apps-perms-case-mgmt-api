import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js'
import { config } from '../../../config.js'
import { createLogger } from '../../helpers/logging/logger.js'

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

/**
 * @param {object} fields
 * @returns {Promise<object>}
 */
export async function addItem(fields) {
  const logger = createLogger()

  const { tenantId, clientId, clientSecret, siteId, listId } =
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

  logger.info(
    `Adding item to SharePoint list with fields: ${JSON.stringify(fields)}`
  )

  logger.info(
    `Using siteId: ${siteId}, listId: ${listId}, URL: ${`/sites/${siteId}/lists/${listId}/items`}`
  )

  return graphClient.api(`/sites/${siteId}/lists/${listId}/items`).post({
    fields
  })
}

/**
 * @param {string} webUrl
 * @param {string} itemId
 * @returns {string}
 */
export const getListItemUrl = (webUrl, itemId) => {
  // build the URL to the SharePoint list item
  // for that we need to remove the last part of the URL path
  // and append the DispForm.aspx with the item ID
  const logger = createLogger()

  const url = new URL(webUrl)
  logger.info(`SharePoint web URL: ${url}`)
  const pathParts = url.pathname.split('/')
  pathParts.pop()
  logger.info(`Path parts after pop: ${pathParts}`)

  const newPath = `${pathParts.join('/')}/DispForm.aspx?ID=${itemId}`
  logger.info(`New path for SharePoint item: ${newPath}`)
  logger.info(`Full URL for SharePoint item: ${url.origin}${newPath}`)

  return `${url.origin}${newPath}`
}
