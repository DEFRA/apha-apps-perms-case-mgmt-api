/**
 * @typedef {{ firstName: string, lastName: string }} Name
 * @typedef {{ addressLine1: string, addressLine2?: string, addressTown: string, addressCounty?: string, addressPostcode: string }} Address
 * @typedef {{ type: 'text', value: string, displayText: string }} TextAnswer
 * @typedef {{ type: 'radio', value: string, displayText: string }} RadioAnswer
 * @typedef {{ type: 'checkbox', value: string[], displayText: string }} CheckboxAnswer
 * @typedef {{ type: 'name', value: Name, displayText: string }} NameAnswer
 * @typedef {{ type: 'address', value: Address, displayText: string }} AddressAnswer
 * @typedef {{ type: 'file', value: { skipped: boolean, path?: string }, displayText: string }} FileAnswer
 * @typedef {{ type: 'date', value: { day: string, month: string, year: string }, displayText: string }} DateAnswer
 * @typedef {{ type: 'number', value: number, displayText: string }} NumberAnswer
 * @typedef { TextAnswer | RadioAnswer | CheckboxAnswer | NameAnswer | AddressAnswer | FileAnswer | DateAnswer | NumberAnswer } AnswerData
 * @typedef {{ question: string, questionKey: string, answer: AnswerData }} QuestionAnswerData
 * @typedef {{ title: string, sectionKey: string, questionAnswers: QuestionAnswerData[]}} SectionData
 * @typedef {{ type: 'text', value: string }} TextKeyFact
 * @typedef {{ type: 'number', value: number }} NumberKeyFact
 * @typedef {{ type: 'address', value: Address }} AddressKeyFact
 * @typedef {{ type: 'name', value: Name }} NameKeyFact
 * @typedef {{ type: 'file', value: string[] }} FileKeyFact
 * @typedef { TextKeyFact | NumberKeyFact | AddressKeyFact | NameKeyFact | FileKeyFact } TypedKeyFact
 * @typedef {{ licenceType?: TypedKeyFact, requester?: TypedKeyFact, movementDirection?: TypedKeyFact, additionalInformation?: TypedKeyFact, numberOfCattle?: TypedKeyFact, originCph?: TypedKeyFact, destinationCph?: TypedKeyFact, originAddress?: TypedKeyFact, destinationAddress?: TypedKeyFact, originKeeperName?: TypedKeyFact, destinationKeeperName?: TypedKeyFact, requesterCph?: TypedKeyFact, biosecurityMaps?: FileKeyFact }} TBKeyFacts
 * @typedef {{ journeyId: string, sections: SectionData[], keyFacts?: TBKeyFacts }} ApplicationData
 */

import { config } from '../../../config.js'
import { getApplicationReference } from '../application-reference/application-reference.js'

export class Application {
  referencePrefix = 'APP'
  configKey
  expectedJourneyId = 'UNKNOWN_JOURNEY'

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
    return config.get('notify')?.[this.configKey]
  }

  getNewReference() {
    return getApplicationReference(this.referencePrefix)
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

/* @export { Application, Section } */
