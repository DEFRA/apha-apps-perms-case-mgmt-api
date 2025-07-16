import { Application } from './application.js'

export class TbApplication extends Application {
  get emailAddress() {
    const section = this.get('licence')
    return section?.get('emailAddress')?.answer.displayText
  }

  get applicantName() {
    const section = this.get('licence')
    return section?.get('fullName')?.answer.displayText || ''
  }
}
