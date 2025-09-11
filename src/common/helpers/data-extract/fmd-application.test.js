import { Application } from './application.js'
import { FmdApplication } from './fmd-application.js'

// Test data constants
const BASE_APPLICATION_DATA = {
  journeyId:
    'APPLY_FOR_A_PERMIT_TO_MOVE_OR_VISIT_ANIMALS_UNDER_DISEASE_CONTROLS_FMD',
  sections: []
}

const LICENCE_SECTION_BASE = {
  title: 'Receiving the licence',
  sectionKey: 'licence',
  questionAnswers: []
}

const EMAIL_QUESTION = {
  question: 'Email address',
  questionKey: 'emailAddress',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'test@example.com',
    displayText: 'test@example.com'
  }
}

const RESPONSIBLE_PERSON_NAME_QUESTION = {
  question: 'Responsible person name',
  questionKey: 'originResponsiblePersonName',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'John Keeper',
    displayText: 'John Keeper'
  }
}

describe('FmdApplication', () => {
  it('should be an instance of FmdApplication', () => {
    const application = new FmdApplication(BASE_APPLICATION_DATA)
    expect(application).toBeInstanceOf(FmdApplication)
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

      const application = new FmdApplication(applicationData)

      expect(application.emailAddress).toBe('test@example.com')
    })

    it('should return undefined when licence section does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new FmdApplication(applicationData)

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

      const application = new FmdApplication(applicationData)

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

      const application = new FmdApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })
  })

  describe('applicantName', () => {
    it('should return responsible person name when available', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [RESPONSIBLE_PERSON_NAME_QUESTION]
          }
        ]
      }

      const application = new FmdApplication(applicationData)

      expect(application.applicantName).toBe('John Keeper')
    })

    it('should return undefined when licence section does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new FmdApplication(applicationData)

      expect(application.applicantName).toBeUndefined()
    })

    it('should return undefined when the name question does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new FmdApplication(applicationData)

      expect(application.applicantName).toBeUndefined()
    })
  })

  describe('inheritance from Application class', () => {
    it('should inherit journeyId property from parent Application class', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        journeyId: 'TEST_JOURNEY_ID'
      }

      const application = new FmdApplication(applicationData)

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

      const application = new FmdApplication(applicationData)
      const licenceSection = application.get('licence')

      expect(licenceSection).toBeDefined()
      expect(licenceSection?.get('emailAddress')).toEqual(EMAIL_QUESTION)
    })

    it('should return undefined when getting non-existent section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new FmdApplication(applicationData)

      expect(application.get('nonExistentSection')).toBeUndefined()
    })
  })
})
