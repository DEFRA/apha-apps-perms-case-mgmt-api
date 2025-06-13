import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import {
  getQuestionFromSections,
  getTbLicenceType
} from '../data-extract/data-extract.js'

/**
 * @param {import('../data-extract/data-extract.js').ApplicationData} application
 * @param {string} reference
 */
export const createSharepointItem = async (application, reference) => {
  await addItem(fields(application, reference))
}

/**
 * @param {import('../data-extract/data-extract.js').ApplicationData} application
 * @param {string} reference
 */
export const fields = (application, reference) => {
  const address =
    /** @type {import('../data-extract/data-extract.js').AddressAnswer} */ (
      getQuestionFromSections('address', 'origin', application.sections)?.answer
    )

  const name =
    /** @type {import('../data-extract/data-extract.js').NameAnswer} */ (
      getQuestionFromSections('fullName', 'licence', application.sections)
        ?.answer
    )

  return {
    ApplicationSubmittedby: 'Owner/Keeper - Origin',
    Office: 'Polwhele',
    MethodofReceipt: 'Digital',
    FirstlineofAddress: address?.value.addressLine1,
    Name: name?.displayText,
    Application_x0020_Reference_x002: reference,
    Licence: getTbLicenceType(application)
  }
}
