import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import {
  getDestinationType,
  getOriginType,
  getQuestionFromSections,
  getTbLicenceType
} from '../data-extract/data-extract.js'

/** @import {
 *   ApplicationData,
 *   NameAnswer,
 *   AddressAnswer,
 *   TextAnswer,
 *   RadioAnswer
 * } from '../data-extract/data-extract.js'
 */

/**
 * @param {ApplicationData} application
 * @param {string} reference
 */
export const createSharepointItem = async (application, reference) => {
  await addItem(fields(application, reference))
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 */
export const fields = (application, reference) => {
  const onOffFarm = /** @type {RadioAnswer} */ (
    getQuestionFromSections('onOffFarm', 'origin', application.sections)?.answer
  )
  const isOnFarm = onOffFarm?.value === 'on'

  const originAddress = /** @type {AddressAnswer} */ (
    getQuestionFromSections('address', 'origin', application.sections)?.answer
  )
  const destinationAddress = /** @type {AddressAnswer} */ (
    getQuestionFromSections(
      'destinationFarmAddress',
      'destination',
      application.sections
    )?.answer
  )

  const address = isOnFarm ? destinationAddress : originAddress

  const name = /** @type {NameAnswer} */ (
    getQuestionFromSections('fullName', 'licence', application.sections)?.answer
  )

  const reasonForMovement = /** @type {TextAnswer} */ (
    getQuestionFromSections(
      'reasonForMovement',
      'destination',
      application.sections
    )?.answer
  )

  const originType = getOriginType(application)
  const destinationType = getDestinationType(application)

  return {
    Application_x0020_Reference_x002: reference,
    Office: 'Polwhele',
    MethodofReceipt: 'Digital',
    ApplicationSubmittedby: `Owner/Keeper - ${isOnFarm ? 'Destination' : 'Origin'}`,
    Name: name?.displayText,
    FirstlineofAddress: address?.value.addressLine1,
    Licence: getTbLicenceType(application),
    UrgentWelfare: reasonForMovement?.value === 'welfare' ? 'Yes' : 'No',
    AFUtoAFU:
      destinationType?.value === 'afu' && originType?.value === 'afu'
        ? 'Yes'
        : 'No'
  }
}
