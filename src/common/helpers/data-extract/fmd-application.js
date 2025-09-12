import { Application } from './application.js'

export class FmdApplication extends Application {
  referencePrefix = 'FM'
  configKey = 'fmd'

  get emailAddress() {
    const section = this.get('licence')
    return section?.get('emailAddress')?.answer?.displayText
  }

  get applicantName() {
    const section = this.get('licence')
    return (
      section?.get('registeredKeeperName')?.answer?.displayText ||
      section?.get('originResponsiblePersonName')?.answer?.displayText
    )
  }
}
