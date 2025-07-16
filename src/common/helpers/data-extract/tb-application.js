import { Application } from './application.js'

/**
 * @typedef {import('./data-extract.js').RadioAnswer} RadioAnswer
 */

export class TbApplication extends Application {
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

  get licenceType() {
    const originType =
      /** @type {RadioAnswer} */ (this.get('origin')?.get('originType')?.answer)
        ?.value || ''
    const destinationType =
      /** @type {RadioAnswer} */ (
        this.get('destination')?.get('destinationType')?.answer
      )?.value || ''

    if (
      ['market', 'unrestricted-farm', 'after-import-location'].includes(
        originType
      ) &&
      this.isTbRestricted(destinationType)
    ) {
      return 'TB15'
    }

    if (
      this.isTbRestricted(originType) &&
      this.isTbRestricted(destinationType)
    ) {
      return 'TB16'
    }

    if (
      (this.isTbRestricted(originType) &&
        (destinationType === 'dedicated-sale' || destinationType === 'afu')) ||
      (originType === 'afu' &&
        ['slaughter', 'afu', 'dedicated-sale'].includes(destinationType))
    ) {
      return 'TB16e'
    }

    if (this.isTbRestricted(originType) && destinationType === 'slaughter') {
      return 'TB24c'
    }

    return ''
  }

  get requesterCphNumber() {
    const origin = this.get('origin')
    const destination = this.get('destination')

    const onOffFarm = origin?.get('onOffFarm')?.answer

    const originCph = origin?.get('cphNumber')?.answer
    const destinationCph = destination?.get('destinationFarmCph')?.answer

    const isOnFarm = onOffFarm?.value === 'on'
    return (isOnFarm ? destinationCph : originCph)?.value
  }
}
