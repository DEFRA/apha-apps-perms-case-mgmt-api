import { Application } from './application.js'
import { ExoticsApplication } from './exotics-application.js'

// Test data constants
const BASE_APPLICATION_DATA = {
  journeyId:
    'APPLY_FOR_A_PERMIT_TO_MOVE_OR_VISIT_ANIMALS_UNDER_DISEASE_CONTROLS_EXOTICS',
  sections: []
}

const LICENCE_SECTION_BASE = {
  title: 'Receiving the licence',
  sectionKey: 'licence',
  questionAnswers: []
}

const EMAIL_QUESTION = {
  question: 'Email address',
  questionKey: 'email',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'test@example.com',
    displayText: 'test@example.com'
  }
}

const KEEPER_NAME_QUESTION = {
  question: 'Keeper name',
  questionKey: 'keeperName',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'John Keeper',
    displayText: 'John Keeper'
  }
}

const ORIGIN_RESPONSIBLE_PERSON_NAME_QUESTION = {
  question: 'Origin responsible person name',
  questionKey: 'originResponsiblePersonName',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'Jane Origin',
    displayText: 'Jane Origin'
  }
}

const VISIT_RESPONSIBLE_PERSON_NAME_QUESTION = {
  question: 'Visit responsible person name',
  questionKey: 'visitResponsiblePersonName',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'Bob Visit',
    displayText: 'Bob Visit'
  }
}

describe('ExoticsApplication', () => {
  it('should be an instance of ExoticsApplication', () => {
    const application = new ExoticsApplication(BASE_APPLICATION_DATA)
    expect(application).toBeInstanceOf(ExoticsApplication)
    expect(application).toBeInstanceOf(Application)
  })

  describe('emailAddress', () => {
    it('should return email address from licence section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [EMAIL_QUESTION]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.emailAddress).toBe('test@example.com')
    })

    it('should return undefined when licence section does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })

    it('should return undefined when email question does not exist in licence section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })

    it('should return undefined when email answer is null', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [
              {
                question: 'Email address',
                questionKey: 'email',
                answer: /** @type {any} */ (null)
              }
            ]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })
  })

  describe('applicantName', () => {
    it('should return keeper name when available', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [
              KEEPER_NAME_QUESTION,
              ORIGIN_RESPONSIBLE_PERSON_NAME_QUESTION,
              VISIT_RESPONSIBLE_PERSON_NAME_QUESTION
            ]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBe('John Keeper')
    })

    it('should return origin responsible person name when keeper name is not available', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [
              ORIGIN_RESPONSIBLE_PERSON_NAME_QUESTION,
              VISIT_RESPONSIBLE_PERSON_NAME_QUESTION
            ]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBe('Jane Origin')
    })

    it('should return visit responsible person name when keeper name and origin responsible person name are not available', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [VISIT_RESPONSIBLE_PERSON_NAME_QUESTION]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBe('Bob Visit')
    })

    it('should return undefined when licence section does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBeUndefined()
    })

    it('should return undefined when none of the name questions exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBeUndefined()
    })

    it('should handle empty displayText gracefully', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [
              {
                question: 'Keeper name',
                questionKey: 'keeperName',
                answer: {
                  type: /** @type {'text'} */ ('text'),
                  value: 'John Keeper',
                  displayText: ''
                }
              },
              ORIGIN_RESPONSIBLE_PERSON_NAME_QUESTION
            ]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBe('Jane Origin')
    })

    it('should prioritize keeper name over other names even when all are present', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [
              ORIGIN_RESPONSIBLE_PERSON_NAME_QUESTION,
              KEEPER_NAME_QUESTION,
              VISIT_RESPONSIBLE_PERSON_NAME_QUESTION
            ]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.applicantName).toBe('John Keeper')
    })
  })

  describe('inheritance from Application class', () => {
    it('should inherit journeyId property from parent Application class', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        journeyId: 'TEST_JOURNEY_ID'
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.journeyId).toBe('TEST_JOURNEY_ID')
    })

    it('should inherit get method from parent Application class', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [EMAIL_QUESTION]
          }
        ]
      }

      const application = new ExoticsApplication(applicationData)
      const licenceSection = application.get('licence')

      expect(licenceSection).toBeDefined()
      expect(licenceSection?.get('email')).toEqual(EMAIL_QUESTION)
    })

    it('should return undefined when getting non-existent section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new ExoticsApplication(applicationData)

      expect(application.get('nonExistentSection')).toBeUndefined()
    })
  })
})
