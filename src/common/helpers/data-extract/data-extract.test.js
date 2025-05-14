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

  it('should return undefined if sections is not an array', () => {
    // @ts-ignore
    const result = getQuestionFromSections(questionOneKey, sectionOneKey, null)
    expect(result).toBeUndefined()
  })
})

describe('getSectionsFromPayload', () => {
  it('should return sections if payload contains a sections property', () => {
    const payload = { sections }
    const result = getSectionsFromPayload(payload)
    expect(result).toEqual(payload.sections)
  })

  it('should return undefined if payload does not contain a sections property', () => {
    const payload = { data: 'some data' }
    const result = getSectionsFromPayload(payload)
    expect(result).toBeUndefined()
  })

  it('should return undefined if payload is not an object', () => {
    const result = getSectionsFromPayload(null)
    expect(result).toBeUndefined()
  })

  it('should return undefined if payload is an empty object', () => {
    const result = getSectionsFromPayload({})
    expect(result).toBeUndefined()
  })
})
