/**
 * @import {QuestionAnswerData, SectionData} from '../helpers/data-extract/data-extract.js'
 */

/**
 * @param {QuestionAnswerData[]} questionAnswers
 * @returns {SectionData}
 */
export const originSection = (questionAnswers) => ({
  sectionKey: 'origin',
  title: 'Movement origin',
  questionAnswers
})

/**
 * @param {QuestionAnswerData[]} questionAnswers
 * @returns {SectionData}
 */
export const destinationSection = (questionAnswers) => ({
  sectionKey: 'destination',
  title: 'Movement destination',
  questionAnswers
})

/**
 * @param {string} value
 * @returns {QuestionAnswerData}
 */
export const originType = (value) => ({
  questionKey: 'originType',
  question: 'What type of premises are the animals moving from?',
  answer: {
    type: 'radio',
    value,
    displayText: value
  }
})

/**
 * @param {string} value
 * @returns {QuestionAnswerData}
 */
export const destinationType = (value) => ({
  questionKey: 'destinationType',
  question: 'What type of premises are the animals moving to?',
  answer: {
    type: 'radio',
    value,
    displayText: value
  }
})
