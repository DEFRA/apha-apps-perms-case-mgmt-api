import { config } from '../../../config.js'
import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import { createApplication } from '../data-extract/data-extract.js'
import { escapeHtml, escapeMarkdown } from '../escape-text.js'

/** @import {
 *   ApplicationData,
 *   NameAnswer,
 *   AddressAnswer
 * } from '../data-extract/application.js'
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
  const application = createApplication(applicationData)

  const origin = application.get('origin')
  const destination = application.get('destination')

  const onOffFarm = origin?.get('onOffFarm')?.answer
  const isOnFarm = onOffFarm?.value === 'on'
  const isOffFarm = onOffFarm?.value === 'off'
  const isOriginRestricted = application.isOriginRestricted

  const originCph = origin?.get('cphNumber')?.answer

  const destinationCph = destination?.get('destinationFarmCph')?.answer
  const additionalInfo = destination?.get('additionalInfo')?.answer

  const sanitizedAdditionalInfo = escapeMarkdown(
    escapeHtml(additionalInfo?.value)
  )

  const cphNumber = application.requesterCphNumber

  const originAddress = /** @type {AddressAnswer} */ (
    origin?.get('address')?.answer
  )
  const destinationAddress = /** @type {AddressAnswer} */ (
    destination?.get('destinationFarmAddress')?.answer
  )

  const fullName = /** @type {NameAnswer} */ (
    application.get('licence')?.get('fullName')?.answer
  )
  const yourName = /** @type {NameAnswer} */ (
    application.get('licence')?.get('yourName')?.answer
  )

  const numberOfCattle = destination?.get('howManyAnimals')?.answer
  const numberOfCattleMaximum = destination?.get(
    'howManyAnimalsMaximum'
  )?.answer

  const { folderPath, siteName, siteBaseUrl } = config.get('sharepoint')
  const supportingMaterialPath = `/sites/${siteName}/Supporting Materials/${folderPath}/${reference}`
  const supportingMaterialLink = `${siteBaseUrl}/sites/${siteName}/Supporting%20Materials/Forms/AllItems.aspx?id=${encodeURIComponent(supportingMaterialPath)}`
  const SupportingMaterial = `<a href=${supportingMaterialLink} target="_blank">Supporting Material</a>`

  const originName =
    isOffFarm || (isOnFarm && isOriginRestricted) ? fullName?.displayText : null

  let destinationName = null
  if (isOnFarm) {
    destinationName = isOriginRestricted
      ? yourName?.displayText
      : fullName?.displayText
  }

  return {
    Application_x0020_Reference_x002: reference,
    Title: cphNumber,
    Office: 'Polwhele',
    MethodofReceipt: 'Digital (Automatically Receipted)',
    ApplicationSubmittedby: `Owner/Keeper - ${isOnFarm ? 'Destination' : 'Origin'}`,
    Name: originName,
    FirstlineofAddress: originAddress?.value.addressLine1,
    Licence: application.licenceType,
    Notes: sanitizedAdditionalInfo,
    OriginCPH: originCph?.value,
    DestinationAddress_x0028_FirstLi: destinationAddress?.value.addressLine1,
    DestinationCPH: destinationCph?.value,
    Destination_x0020_Name: destinationName,
    NumberofCattle: numberOfCattle?.value ?? numberOfCattleMaximum?.value,
    SupportingMaterial
  }
}
