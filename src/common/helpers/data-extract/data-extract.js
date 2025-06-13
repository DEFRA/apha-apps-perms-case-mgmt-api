/**
 * @typedef {{ type: 'text', value: string, displayText: string }} TextAnswer
 * @typedef {{ type: 'radio', value: string, displayText: string }} RadioAnswer
 * @typedef {{ type: 'radio', value: string[], displayText: string }} CheckboxAnswer
 * @typedef {{ type: 'name', value: { firstName: string, lastName: string }, displayText: string }} NameAnswer
 * @typedef {{ type: 'address', value: { addressLine1: string, addressLine2?: string, addressTown: string, addressCounty?: string, addressPostcode: string }, displayText: string }} AddressAnswer
 * @typedef {{ type: 'file', value: { skipped: boolean, path?: string }, displayText: string }} FileAnswer
 * @typedef {{ type: 'date', value: { day: string, month: string, year: string }, displayText: string }} DateAnswer
 * @typedef { TextAnswer | RadioAnswer | CheckboxAnswer | NameAnswer | AddressAnswer | FileAnswer } AnswerData
 * @typedef {{ question: string, questionKey: string, answer: AnswerData }} QuestionAnswerData
 * @typedef {{ title: string, sectionKey: string, questionAnswers: QuestionAnswerData[]}} SectionData
 * @typedef {{ sections: SectionData[]}} ApplicationData
 */

/**
 * @param {string} questionKey
 * @param {string} sectionKey
 * @param {SectionData[]} sections
 * @returns {QuestionAnswerData|undefined}
 */
export const getQuestionFromSections = (questionKey, sectionKey, sections) => {
  return sections
    .find((section) => section.sectionKey === sectionKey)
    ?.questionAnswers.find((question) => question.questionKey === questionKey)
}

/**
 * @param {ApplicationData} payload
 * @returns {SectionData[]}
 */
export const getSectionsFromPayload = (payload) => {
  return payload.sections
}

/** @param {ApplicationData} application */
export const getOriginType = (application) =>
  /** @type {RadioAnswer} */ (
    getQuestionFromSections('originType', 'origin', application.sections)
      ?.answer
  )

/** @param {ApplicationData} application */
export const getDestinationType = (application) =>
  /** @type {RadioAnswer} */ (
    getQuestionFromSections(
      'destinationType',
      'destination',
      application.sections
    )?.answer
  )

/** @param {RadioAnswer | undefined} premisesTypeAnswer */
const isTbRestricted = (premisesTypeAnswer) =>
  ['tb-restricted-farm', 'zoo', 'lab', 'other'].includes(
    premisesTypeAnswer?.value ?? ''
  )

/**
 * @param {ApplicationData} application
 */
export const getTbLicenceType = (application) => {
  const originType = getOriginType(application)
  const destinationType = getDestinationType(application)

  if (!isTbRestricted(originType)) {
    return 'TB15'
  }

  if (isTbRestricted(destinationType)) {
    return 'TB16'
  }

  if (destinationType?.value === 'afu') {
    return 'TB16e'
  }

  if (destinationType?.value === 'dedicated-sale') {
    return 'TB16e'
  }

  if (destinationType?.value === 'slaughter') {
    return 'TB24c'
  }
}
