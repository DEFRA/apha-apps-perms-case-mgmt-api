/**
 * @typedef {{ type: 'text', value: string, displayText: string }} TextAnswer
 * @typedef {{ type: 'radio', value: string, displayText: string }} RadioAnswer
 * @typedef {{ type: 'checkbox', value: string[], displayText: string }} CheckboxAnswer
 * @typedef {{ type: 'name', value: { firstName: string, lastName: string }, displayText: string }} NameAnswer
 * @typedef {{ type: 'address', value: { addressLine1: string, addressLine2?: string, addressTown: string, addressCounty?: string, addressPostcode: string }, displayText: string }} AddressAnswer
 * @typedef {{ type: 'file', value: { skipped: boolean, path?: string }, displayText: string }} FileAnswer
 * @typedef {{ type: 'date', value: { day: string, month: string, year: string }, displayText: string }} DateAnswer
 * @typedef { TextAnswer | RadioAnswer | CheckboxAnswer | NameAnswer | AddressAnswer | FileAnswer } AnswerData
 * @typedef {{ question: string, questionKey: string, answer: AnswerData }} QuestionAnswerData
 * @typedef {{ title: string, sectionKey: string, questionAnswers: QuestionAnswerData[]}} SectionData
 * @typedef {{ journeyId: string, sections: SectionData[]}} ApplicationData
 */

import { config } from '../../../config.js'
import { getApplicationReference } from '../application-reference/application-reference.js'

export class Application {
  referencePrefix = 'APP'
  configKey

  /** @param {ApplicationData} data */
  constructor(data) {
    this._data = data
  }

  /**
   * @param {string} sectionKey
   * @returns {Section | undefined}
   */
  get(sectionKey) {
    const sectionData = this._data.sections.find(
      (section) => section.sectionKey === sectionKey
    )

    return sectionData ? new Section(sectionData) : undefined
  }

  get journeyId() {
    return this._data.journeyId
  }

  get emailConfig() {
    return config.get('notify')?.[this.configKey].caseDelivery
  }

  getNewReference() {
    return getApplicationReference(this.referencePrefix)
  }

  static async isTbApplication(application) {
    // dynamic import required due to circular dependencies
    const { TbApplication } = await import('./tb-application.js')
    return application instanceof TbApplication
  }
}

export class Section {
  /** @param {SectionData} data */
  constructor(data) {
    this._data = data
  }

  /**
   * @param {string} questionKey
   * @returns {QuestionAnswerData | undefined}
   */
  get(questionKey) {
    return this._data?.questionAnswers.find(
      (question) => question.questionKey === questionKey
    )
  }
}
