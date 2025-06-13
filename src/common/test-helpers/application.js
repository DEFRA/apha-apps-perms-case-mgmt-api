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
 * @param {QuestionAnswerData[]} questionAnswers
 * @returns {SectionData}
 */
export const licenceSection = (questionAnswers) => ({
  sectionKey: 'licence',
  title: 'Receiving the licence',
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

/**
 * @param {{firstName: string, lastName: string}} name
 * @returns {QuestionAnswerData}
 */
export const keeperName = ({ firstName, lastName }) => ({
  question: 'What is the full name of the keeper of the animals?',
  questionKey: 'fullName',
  answer: {
    type: 'name',
    value: {
      firstName,
      lastName
    },
    displayText: `${firstName} ${lastName}`
  }
})

/**
 * @param {'on'|'off'} onOffFarm
 * @returns {QuestionAnswerData}
 */
export const onOffFarm = (onOffFarm) => ({
  question: 'Are the animals moving off of or on to the premises?',
  questionKey: 'onOffFarm',
  answer: {
    type: 'radio',
    value: onOffFarm,
    displayText: onOffFarm
  }
})

/**
 * @param {string} cphNumber
 * @returns {QuestionAnswerData}
 */
export const originCph = (cphNumber) => ({
  question: 'What is the CPH number of the farm?',
  questionKey: 'cphNumber',
  answer: {
    type: 'text',
    value: cphNumber,
    displayText: cphNumber
  }
})

/**
 * @param {object} addressData
 * @returns {QuestionAnswerData}
 */
export const originAddress = (addressData) => ({
  question: 'What is the address of the origin farm?',
  questionKey: 'address',
  answer: {
    type: 'address',
    value: addressData,
    displayText: Object.values(addressData).join('\n')
  }
})

/**
 * @param {string} reason
 * @returns {QuestionAnswerData}
 */
export const reasonForMovement = (reason) => ({
  question: 'What is the reason for the movement?',
  questionKey: 'reasonForMovement',
  answer: {
    type: 'radio',
    value: reason,
    displayText: reason
  }
})
