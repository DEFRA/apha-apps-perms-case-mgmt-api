import {
  getQuestionFromSections,
  getSectionsFromPayload
} from './data-extract.js'

/**
 * @import {QuestionAnswerData} from './data-extract.js'
 * @import {SectionData} from './data-extract.js'
 */

const questionOneKey = 'q1'
const questionTwoKey = 'q2'
const sectionOneKey = 'section1'

/** @type {QuestionAnswerData} */
const questionOne = {
  question: 'Question 1',
  questionKey: questionOneKey,
  answer: { type: 'text', value: 'Answer 1', displayText: 'Answer 1' }
}
/** @type {QuestionAnswerData} */
const questionTwo = {
  question: 'Question 2',
  questionKey: questionTwoKey,
  answer: { type: 'text', value: 'Answer 2', displayText: 'Answer 2' }
}
/** @type {SectionData} */
const sectionOne = {
  title: 'Section 1',
  sectionKey: sectionOneKey,
  questionAnswers: [questionOne, questionTwo]
}

const sections = [sectionOne]

describe('getQuestionFromSections', () => {
  it('should return the correct question when section and question keys match', () => {
    const result = getQuestionFromSections(
      questionOneKey,
      sectionOneKey,
      sections
    )
    expect(result).toEqual(questionOne)
  })

  it('should return undefined if sectionKey does not match', () => {
    const result = getQuestionFromSections(
      questionOneKey,
      'anotherSectionKey',
      sections
    )
    expect(result).toBeUndefined()
  })

  it('should return undefined if questionKey does not match', () => {
    const result = getQuestionFromSections(
      'anotherQuestionKey',
      sectionOneKey,
      sections
    )
    expect(result).toBeUndefined()
  })

  describe('getSectionsFromPayload', () => {
    it('should return the sections array from the payload', () => {
      const payload = { sections }
      const result = getSectionsFromPayload(payload)
      expect(result).toBe(sections)
    })

    it('should return an empty array if payload.sections is an empty array', () => {
      const payload = { sections: [] }
      const result = getSectionsFromPayload(payload)
      expect(result).toEqual([])
    })
  })
})
