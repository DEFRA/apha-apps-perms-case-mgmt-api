import { addItem } from '../../connectors/sharepoint/sharepoint.js'

export const createSharepointItem = async (application, reference) => {
  const fields = {
    Application_x0020_Reference_x002: reference
  }
  return addItem(fields)
}
