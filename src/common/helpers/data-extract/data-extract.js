import { Application, Section } from './application.js'
import { ExoticsApplication } from './exotics-application.js'
import { TbApplication } from './tb-application.js'

/**
 * @import { ApplicationData, SectionData, QuestionAnswerData } from './application.js'
 */

const journeyApplications = {
  GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_EXOTICS:
    ExoticsApplication,
  GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND:
    TbApplication
}

export const createApplication = (data) => {
  let ApplicationContstructor = journeyApplications[data.journeyId]

  if (!ApplicationContstructor) {
    ApplicationContstructor = TbApplication
  }

  return new ApplicationContstructor(data)
}

export { Application, Section }

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
