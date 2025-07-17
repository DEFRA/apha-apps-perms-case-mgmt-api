import { Application } from './application.js'

/**
 * @import {RadioAnswer, TextAnswer} from './application.js'
 */

export class TbApplication extends Application {
  referencePrefix = 'TB'
  configKey = 'tb'

  get emailAddress() {
    const section = this.get('licence')
    return section?.get('emailAddress')?.answer.displayText
  }

  get applicantName() {
    const section = this.get('licence')
    return section?.get('fullName')?.answer.displayText || ''
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

  get licenceType() {
    const originType = this.getRadioValue('originType', 'origin')
    const destinationType = this.getRadioValue('destinationType', 'destination')

    const isOriginUnrestricted = [
      'market',
      'unrestricted-farm',
      'after-import-location'
    ].includes(originType)
    const isOriginRestricted = this.isTbRestricted(originType)
    const isDestinationRestricted = this.isTbRestricted(destinationType)

    if (isOriginUnrestricted && isDestinationRestricted) {
      return 'TB15'
    }

    if (isOriginRestricted && isDestinationRestricted) {
      return 'TB16'
    }

    if (this.isTb16eCase(originType, destinationType, isOriginRestricted)) {
      return 'TB16e'
    }

    if (isOriginRestricted && destinationType === 'slaughter') {
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
    const isDestinationSale = ['dedicated-sale', 'afu'].includes(
      destinationType
    )
    const isAfuToSpecialDestination =
      originType === 'afu' &&
      ['slaughter', 'afu', 'dedicated-sale'].includes(destinationType)

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
