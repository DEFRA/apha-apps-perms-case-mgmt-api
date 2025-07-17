import { Application } from './application.js'

export class ExoticsApplication extends Application {
  get emailAddress() {
    const section = this.get('licence')
    return section?.get('email')?.answer?.displayText
  }

  get applicantName() {
    const section = this.get('licence')
    return (
      section?.get('keeperName')?.answer?.displayText ||
      section?.get('originResponsiblePersonName')?.answer?.displayText ||
      section?.get('visitResponsiblePersonName')?.answer?.displayText
    )
  }
}
