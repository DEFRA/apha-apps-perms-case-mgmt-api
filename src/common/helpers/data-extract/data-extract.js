/**
 * @typedef  { 'name' | 'file' | 'text' |' radio' | 'address' | 'checkbox' } AnswerType
 * @typedef  {{ type: AnswerType, value: string, displayText: string }} AnswerData
 * @typedef  {{ question: string, questionKey: string, answer: AnswerData }} QuestionAnswerData
 * @typedef  {{ title: string, sectionKey: string, questionAnswers: QuestionAnswerData[]}} SectionData
 */

/**
 * @param {string} questionKey
 * @param {string} sectionKey
 * @param {SectionData[]} sections
 * @returns {QuestionAnswerData|undefined}
 */
export const getQuestionFromSections = (questionKey, sectionKey, sections) => {
  const section = Array.isArray(sections)
    ? sections?.find((section) => section.sectionKey === sectionKey)
    : {}
  const question = Array.isArray(section?.questionAnswers)
    ? section?.questionAnswers?.find(
        (question) => question.questionKey === questionKey
      )
    : undefined
  return question
}

/**
 * @param {object} payload
 * @returns {SectionData[]|undefined}
 */
export const getSectionsFromPayload = (payload) => {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'sections' in payload
  ) {
    return payload.sections
  }
}
