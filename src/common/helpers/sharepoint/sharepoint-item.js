import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import { Application, getTbLicenceType } from '../data-extract/data-extract.js'

/** @import {
 *   ApplicationData,
 *   NameAnswer,
 *   AddressAnswer
 * } from '../data-extract/data-extract.js'
 */

/**
 * @param {ApplicationData} application
 * @param {string} reference
 */
export const createSharepointItem = async (application, reference) => {
  return addItem(fields(application, reference))
}

/**
 * @param {ApplicationData} applicationData
 * @param {string} reference
 */
export const fields = (applicationData, reference) => {
  const application = new Application(applicationData)

  const origin = application.get('origin')
  const destination = application.get('destination')

  const onOffFarm = origin?.get('onOffFarm')?.answer
  const isOnFarm = onOffFarm?.value === 'on'

  const originCph = origin?.get('cphNumber')?.answer
  const destinationCph = destination?.get('destinationFarmCph')?.answer
  const cphNumber = isOnFarm ? destinationCph : originCph

  const originAddress = /** @type {AddressAnswer} */ (
    origin?.get('address')?.answer
  )
  const destinationAddress = /** @type {AddressAnswer} */ (
    destination?.get('destinationFarmAddress')?.answer
  )

  const name = /** @type {NameAnswer} */ (
    application.get('licence')?.get('fullName')?.answer
  )

  const reasonForMovement = destination?.get('reasonForMovement')?.answer

  const originType = origin?.get('originType')?.answer
  const destinationType = destination?.get('destinationType')?.answer

  const numberOfCattle = destination?.get('howManyAnimals')?.answer
  const numberOfCattleMaximum = destination?.get(
    'howManyAnimalsMaximum'
  )?.answer

  return {
    Application_x0020_Reference_x002: reference,
    Title: cphNumber?.value,
    Office: 'Polwhele',
    MethodofReceipt: 'Digital',
    ApplicationSubmittedby: `Owner/Keeper - ${isOnFarm ? 'Destination' : 'Origin'}`,
    Name: name?.displayText,
    FirstlineofAddress: originAddress?.value.addressLine1,
    Licence: getTbLicenceType(applicationData),
    DestinationAddress_x0028_FirstLi: destinationAddress?.value.addressLine1,
    DestinationCPH: destinationCph?.value,
    UrgentWelfare: reasonForMovement?.value === 'welfare',
    NumberofCattle: numberOfCattle?.value ?? numberOfCattleMaximum?.value,
    AFUtoAFU: destinationType?.value === 'afu' && originType?.value === 'afu'
  }
}
