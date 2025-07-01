import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js'
import { config } from '../../../config.js'

const scopes = ['https://graph.microsoft.com/.default']

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
    scopes
  })

  const graphClient = Client.initWithMiddleware({ authProvider })
  return graphClient
    .api(
      `/drives/${driveId}/items/rootx:/${folderPath}/${reference}/${fileName}:/content?@microsoft.graph.conflictBehavior=fail`
      // using @microsoft.graph.conflictBehavior=fail to not allow duplicates so uploading same file returns an error
    )
    .put(file)
}

/**
 * @param {object} fields
 * @returns {Promise<object>}
 */
export async function addItem(fields) {
  const { tenantId, clientId, clientSecret, siteId, listId } =
    config.get('sharepoint')

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes
  })

  const graphClient = Client.initWithMiddleware({ authProvider })

  return graphClient.api(`/sites/${siteId}/lists/${listId}/items`).post({
    fields
  })
}

/**
 * @param {string} fieldName
 * @param {string} fieldValue
 * @returns {Promise<object>}
 */
export async function getListItemByFieldValue(fieldName, fieldValue) {
  const { tenantId, clientId, clientSecret, siteId, listId } =
    config.get('sharepoint')

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes
  })

  const graphClient = Client.initWithMiddleware({ authProvider })

  const filter = `fields/${fieldName} eq '${fieldValue}'`

  return graphClient
    .api(`/sites/${siteId}/lists/${listId}/items?$filter=${filter}`)
    .get()
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
  const url = new URL(webUrl)
  const pathParts = url.pathname.split('/')
  pathParts.pop()

  const newPath = `${pathParts.join('/')}/DispForm.aspx?ID=${itemId}`

  return `${url.origin}${newPath}`
}
