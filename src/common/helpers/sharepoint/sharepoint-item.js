import { addItem } from '../../connectors/sharepoint/sharepoint.js'

export const createSharepointItem = async (application, reference) => {
  return addItem(application, reference)
}
