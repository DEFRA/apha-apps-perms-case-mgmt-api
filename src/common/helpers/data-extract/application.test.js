import { Application, Section } from './application.js'

/** @import {QuestionAnswerData, ApplicationData} from './application.js' */

/** @type {QuestionAnswerData} */
const questionAnswer = {
  question: 'Question 1',
  questionKey: 'question-1',
  answer: { type: 'text', value: 'Answer 1', displayText: 'Answer 1' }
}

describe('Section', () => {
  it('returns the matching question answer', () => {
    const section = new Section({
      title: 'Section 1',
      sectionKey: 'section-1',
      questionAnswers: [questionAnswer]
    })

    expect(section.get('question-1')).toEqual(questionAnswer)
  })

  it('returns undefined when question answers are missing', () => {
    /** @type {any} */
    const sectionData = {
      title: 'Section 1',
      sectionKey: 'section-1'
    }
    const section = new Section(sectionData)

    expect(section.questionAnswers).toEqual([])
    expect(section.get('question-1')).toBeUndefined()
  })
})

describe('Application', () => {
  /** @type {ApplicationData} */
  const applicationData = {
    journeyId: 'JOURNEY_ID',
    sections: [
      {
        title: 'Section 1',
        sectionKey: 'section-1',
        questionAnswers: [questionAnswer]
      }
    ],
    keyFacts: {
      licenceType: { type: 'text', value: 'LICENCE_TYPE' },
      requesterCph: { type: 'text', value: 'CPH_NUMBER' }
    }
  }

  it('exposes application data and derived values', () => {
    const application = new Application(applicationData)

    expect(application.data).toBe(applicationData)
    expect(application.journeyId).toBe('JOURNEY_ID')
    expect(application.licenceType).toBe('LICENCE_TYPE')
    expect(application.requesterCph).toBe('CPH_NUMBER')
  })

  it('returns wrapped sections and finds a section by key', () => {
    const application = new Application(applicationData)

    expect(application.sections).toHaveLength(1)
    expect(application.sections[0]).toBeInstanceOf(Section)
    expect(application.get('section-1')).toBeInstanceOf(Section)
    expect(application.get('missing-section')).toBeUndefined()
  })

  it('handles missing optional sections and key facts', () => {
    const application = new Application({
      journeyId: 'JOURNEY_ID',
      sections: []
    })

    expect(application.sections).toEqual([])
    expect(application.get('section-1')).toBeUndefined()
    expect(application.licenceType).toBeUndefined()
    expect(application.requesterCph).toBeUndefined()
  })
})
