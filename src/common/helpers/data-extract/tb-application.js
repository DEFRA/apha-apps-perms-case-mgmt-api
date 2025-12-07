import { Application } from './application.js'

/**
 * @import {RadioAnswer, TextAnswer} from './application.js'
 */

export class TbApplication extends Application {
  referencePrefix = 'TB'
  configKey = 'tb'

  get emailAddress() {
    const section = this.get('licence')
    const destinationEmail =
      section?.get('destinationEmail')?.answer.displayText
    const emailAddress = section?.get('emailAddress')?.answer.displayText
    return emailAddress || destinationEmail || ''
  }

  get applicantName() {
    const section = this.get('licence')
    const yourName = section?.get('yourName')?.answer.displayText
    const fullName = section?.get('fullName')?.answer.displayText
    return yourName || fullName || ''
  }

  isTbRestricted(premesisType) {
    return ['tb-restricted-farm', 'zoo', 'lab', 'other'].includes(premesisType)
  }

  /**
   * @private
   * @param {string} questionKey
   * @param {string} sectionKey
   * @returns {string}
   */
  getRadioValue(questionKey, sectionKey) {
    return (
      /** @type {RadioAnswer} */ (
        this.get(sectionKey)?.get(questionKey)?.answer
      )?.value || ''
    )
  }

  get originType() {
    return this.getRadioValue('originType', 'origin')
  }

  get destinationType() {
    return this.getRadioValue('destinationType', 'destination')
  }

  get isOriginRestricted() {
    return this.isTbRestricted(this.originType)
  }

  get isOriginUnrestricted() {
    return ['market', 'unrestricted-farm', 'after-import-location'].includes(
      this.originType
    )
  }

  get licenceType() {
    const isDestinationRestricted = this.isTbRestricted(this.destinationType)

    if (this.isOriginUnrestricted && isDestinationRestricted) {
      return 'TB15'
    }

    if (this.isOriginRestricted && isDestinationRestricted) {
      return 'TB16'
    }

    if (
      this.isTb16eCase(
        this.originType,
        this.destinationType,
        this.isOriginRestricted
      )
    ) {
      return 'TB16e'
    }

    if (this.isOriginRestricted && this.destinationType === 'slaughter') {
      return 'TB24c'
    }

    return ''
  }

  /**
   * @private
   * @param {string} originType
   * @param {string} destinationType
   * @param {boolean} isOriginRestricted
   * @returns {boolean}
   */
  isTb16eCase(originType, destinationType, isOriginRestricted) {
    const destiantionTypes = ['dedicated-sale', 'afu', 'market-afu']
    const isDestinationSale = destiantionTypes.includes(destinationType)
    const isAfuToSpecialDestination =
      originType === 'afu' &&
      ['slaughter', ...destiantionTypes].includes(destinationType)

    return (
      (isOriginRestricted && isDestinationSale) || isAfuToSpecialDestination
    )
  }

  /**
   * @return {string} The CPH number of the requester
   */
  get requesterCphNumber() {
    const origin = this.get('origin')
    const destination = this.get('destination')

    const onOffFarm = origin?.get('onOffFarm')?.answer

    const originCph = /** @type {TextAnswer} */ (
      origin?.get('cphNumber')?.answer
    )
    const destinationCph = /** @type {TextAnswer} */ (
      destination?.get('destinationFarmCph')?.answer
    )

    const isOnFarm = onOffFarm?.value === 'on'
    return (isOnFarm ? destinationCph : originCph)?.value || ''
  }
}
