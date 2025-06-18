import { config } from '../../../config.js'
import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import {
  Application,
  getRequesterCphNumber,
  getTbLicenceType
} from '../data-extract/data-extract.js'

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
  const isOffFarm = onOffFarm?.value === 'off'

  const originCph = origin?.get('cphNumber')?.answer

  const destinationCph = destination?.get('destinationFarmCph')?.answer
  const cphNumber = getRequesterCphNumber(application)

  const originAddress = /** @type {AddressAnswer} */ (
    origin?.get('address')?.answer
  )
  const destinationAddress = /** @type {AddressAnswer} */ (
    destination?.get('destinationFarmAddress')?.answer
  )

  const name = /** @type {NameAnswer} */ (
    application.get('licence')?.get('fullName')?.answer
  )

  const originType = origin?.get('originType')?.answer
  const destinationType = destination?.get('destinationType')?.answer

  const numberOfCattle = destination?.get('howManyAnimals')?.answer
  const numberOfCattleMaximum = destination?.get(
    'howManyAnimalsMaximum'
  )?.answer

  const { folderPath, siteName, siteBaseUrl } = config.get('sharepoint')
  const supportingMaterialPath = `/sites/${siteName}/Shared Documents/${folderPath}/${reference}`
  const supportingMaterialLink = `${siteBaseUrl}/sites/${siteName}/Shared%20Documents/Forms/AllItems.aspx?id=${encodeURIComponent(supportingMaterialPath)}`
  const SupportingMaterial = `<a href=${supportingMaterialLink} target="_blank">Supporting Material</a>`

  return {
    Application_x0020_Reference_x002: reference,
    Title: cphNumber,
    Office: 'Polwhele',
    MethodofReceipt: 'Digital',
    ApplicationSubmittedby: `Owner/Keeper - ${isOnFarm ? 'Destination' : 'Origin'}`,
    Name: isOffFarm ? name?.displayText : null,
    FirstlineofAddress: originAddress?.value.addressLine1,
    Licence: getTbLicenceType(applicationData),
    OriginCPH: originCph?.value,
    DestinationAddress_x0028_FirstLi: destinationAddress?.value.addressLine1,
    DestinationCPH: destinationCph?.value,
    Destination_x0020_Name: isOnFarm ? name?.displayText : null,
    NumberofCattle: numberOfCattle?.value ?? numberOfCattleMaximum?.value,
    AFUtoAFU: destinationType?.value === 'afu' && originType?.value === 'afu',
    SupportingMaterial
  }
}
