import { config } from '../../../config.js'
import { addItem } from '../../connectors/sharepoint/sharepoint.js'
import {
  createApplication,
  getQuestionFromSections
} from '../data-extract/data-extract.js'
import { escapeHtml, escapeMarkdown } from '../escape-text.js'
import { createLogger } from '../logging/logger.js'

/** @import {
 *   ApplicationData,
 *   NameAnswer,
 *   AddressAnswer,
 *   FileAnswer
 * } from '../data-extract/application.js'
 */

const logger = createLogger()

/**
 * @param {ApplicationData} application
 * @param {string} reference
 */
export const createSharepointItem = async (application, reference) => {
  const payload = fields(application, reference)
  return addItem(payload)
}

/**
 * @param {ApplicationData} applicationData
 * @param {string} reference
 */
export const fields = (applicationData, reference) => {
  return generateLegacyFields(applicationData, reference)
}

/**
 * Generates SharePoint payload using keyFacts data
 * @param {ApplicationData} applicationData
 * @param {string} reference
 */
const generatePayloadFromKeyFacts = (applicationData, reference) => {
  const { keyFacts } = applicationData

  if (!keyFacts) {
    return null
  }

  const sanitizedAdditionalInfo = escapeMarkdown(
    escapeHtml(keyFacts.additionalInformation)
  )

  const originName = keyFacts.originKeeperName
    ? `${keyFacts.originKeeperName.firstName} ${keyFacts.originKeeperName.lastName}`
    : null

  const destinationName = keyFacts.destinationKeeperName
    ? `${keyFacts.destinationKeeperName.firstName} ${keyFacts.destinationKeeperName.lastName}`
    : null

  const applicationSubmittedBy =
    keyFacts.movementDirection === 'on'
      ? 'Owner/Keeper - Destination'
      : 'Owner/Keeper - Origin'

  const { folderPath, siteName, siteBaseUrl } = config.get('sharepoint')
  const supportingMaterialPath = `/sites/${siteName}/Supporting Materials/${folderPath}/${reference}`
  const supportingMaterialLink = `${siteBaseUrl}/sites/${siteName}/Supporting%20Materials/Forms/AllItems.aspx?id=${encodeURIComponent(supportingMaterialPath)}`
  const SupportingMaterial = `<a href=${supportingMaterialLink} target="_blank">Supporting Material</a>`

  return {
    Application_x0020_Reference_x002: reference,
    Title: keyFacts.requesterCph,
    Office: 'Polwhele',
    MethodofReceipt: 'Digital (Automatically Receipted)',
    ApplicationSubmittedby: applicationSubmittedBy,
    Name: originName,
    FirstlineofAddress: keyFacts.originAddress?.addressLine1,
    Licence: keyFacts.licenceType,
    Notes: sanitizedAdditionalInfo,
    OriginCPH: keyFacts.originCph,
    DestinationAddress_x0028_FirstLi: keyFacts.destinationAddress?.addressLine1,
    DestinationCPH: keyFacts.destinationCph,
    Destination_x0020_Name: destinationName,
    NumberofCattle: keyFacts.numberOfCattle?.toString(),
    SupportingMaterial
  }
}

/**
 * Compares two SharePoint payloads and logs differences
 * @param {object} existingPayload - Payload generated using existing approach
 * @param {object} keyFactsGeneratePayload - Payload generated using keyFacts
 * @param {string} reference - Application reference number
 */
const comparePayloads = (
  existingPayload,
  keyFactsGeneratePayload,
  reference
) => {
  const fieldKeys = [
    'Application_x0020_Reference_x002',
    'Title',
    'Office',
    'MethodofReceipt',
    'ApplicationSubmittedby',
    'Name',
    'FirstlineofAddress',
    'Licence',
    'Notes',
    'OriginCPH',
    'DestinationAddress_x0028_FirstLi',
    'DestinationCPH',
    'Destination_x0020_Name',
    'NumberofCattle'
  ]

  for (const fieldKey of fieldKeys) {
    const existingValue = existingPayload[fieldKey]
    const candidateValue = keyFactsGeneratePayload[fieldKey]

    if (existingValue !== candidateValue) {
      logger.warn(
        `${reference} key facts matching error: ${fieldKey} differs (existing: "${existingValue}", candidate: "${candidateValue}")`
      )
    }
  }
}

/**
 * Compares biosecurity map keys between keyFacts and existing approach
 * @param {ApplicationData} applicationData
 * @param {string} reference - Application reference number
 */
const compareBiosecurityMapKeys = (applicationData, reference) => {
  const { keyFacts } = applicationData

  const keyFactsBiosecurityMaps = keyFacts?.biosecurityMaps || []
  const keyFactsFirstKey = keyFactsBiosecurityMaps[0]

  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      applicationData?.sections
    )?.answer
  )

  const existingKey = fileAnswer?.value?.path

  if (keyFactsFirstKey !== existingKey) {
    logger.warn(
      `${reference} key facts matching error: biosecurity map keys differ (keyFacts: "${keyFactsFirstKey}", existing: "${existingKey}")`
    )
  }
}

/**
 * Validates keyFacts payload against existing implementation
 * @param {ApplicationData} applicationData
 * @param {string} reference
 */
export const validateKeyFactsPayload = (applicationData, reference) => {
  const { keyFacts } = applicationData

  if (!keyFacts) {
    return
  }

  try {
    compareBiosecurityMapKeys(applicationData, reference)

    const keyFactsGeneratePayload = generatePayloadFromKeyFacts(
      applicationData,
      reference
    )
    const existingPayload = generateLegacyFields(applicationData, reference)

    if (keyFactsGeneratePayload) {
      comparePayloads(existingPayload, keyFactsGeneratePayload, reference)
    }
  } catch (error) {
    logger.warn(
      `Failed to validate keyFacts payload for ${reference}: ${error.message}`
    )
  }
}

/**
 * Generates SharePoint fields using the legacy (existing) approach
 * @param {ApplicationData} applicationData
 * @param {string} reference
 */
const generateLegacyFields = (applicationData, reference) => {
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
