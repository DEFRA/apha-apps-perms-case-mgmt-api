import { ExoticsApplication } from './exotics-application.js'

describe('ExoticsApplication', () => {
  let mockApplicationData

  beforeEach(() => {
    mockApplicationData = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_EXOTICS',
      sections: [
        {
          title: 'Licence Information',
          sectionKey: 'licence',
          questionAnswers: [
            {
              question: 'Email address',
              questionKey: 'email',
              answer: {
                type: 'text',
                value: 'test@example.com',
                displayText: 'test@example.com'
              }
            },
            {
              question: 'Keeper name',
              questionKey: 'keeperName',
              answer: {
                type: 'text',
                value: 'John Keeper',
                displayText: 'John Keeper'
              }
            },
            {
              question: 'Origin responsible person name',
              questionKey: 'originResponsiblePersonName',
              answer: {
                type: 'text',
                value: 'Jane Origin',
                displayText: 'Jane Origin'
              }
            },
            {
              question: 'Visit responsible person name',
              questionKey: 'visitResponsiblePersonName',
              answer: {
                type: 'text',
                value: 'Bob Visit',
                displayText: 'Bob Visit'
              }
            }
          ]
        }
      ]
    }
  })

  describe('emailAddress', () => {
    it('should return email address from licence section', () => {
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.emailAddress).toBe('test@example.com')
    })

    it('should return undefined when licence section does not exist', () => {
      mockApplicationData.sections = []
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.emailAddress).toBeUndefined()
    })

    it('should return undefined when email question does not exist', () => {
      mockApplicationData.sections.at(0).questionAnswers = []
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.emailAddress).toBeUndefined()
    })
  })

  describe('applicantName', () => {
    it('should return keeperName when available', () => {
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.applicantName).toBe('John Keeper')
    })

    it('should return originResponsiblePersonName when keeperName is not available', () => {
      mockApplicationData.sections.at(0).questionAnswers =
        mockApplicationData.sections
          .at(0)
          .questionAnswers.filter((qa) => qa.questionKey !== 'keeperName')
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.applicantName).toBe('Jane Origin')
    })

    it('should return visitResponsiblePersonName when neither keeperName nor originResponsiblePersonName are available', () => {
      mockApplicationData.sections.at(0).questionAnswers =
        mockApplicationData.sections
          .at(0)
          .questionAnswers.filter(
            (qa) =>
              qa.questionKey !== 'keeperName' &&
              qa.questionKey !== 'originResponsiblePersonName'
          )
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.applicantName).toBe('Bob Visit')
    })

    it('should return undefined when no name fields are available', () => {
      mockApplicationData.sections.at(0).questionAnswers =
        mockApplicationData.sections
          .at(0)
          .questionAnswers.filter(
            (qa) =>
              ![
                'keeperName',
                'originResponsiblePersonName',
                'visitResponsiblePersonName'
              ].includes(qa.questionKey)
          )
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.applicantName).toBeUndefined()
    })

    it('should return undefined when licence section does not exist', () => {
      mockApplicationData.sections = []
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.applicantName).toBeUndefined()
    })
  })

  describe('inheritance', () => {
    it('should inherit from Application class', () => {
      const application = new ExoticsApplication(mockApplicationData)

      expect(application.journeyId).toBe(
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_EXOTICS'
      )
      expect(typeof application.get).toBe('function')
    })
  })
})
