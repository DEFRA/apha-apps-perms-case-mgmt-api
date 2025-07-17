import { TbApplication } from './tb-application.js'

describe('TbApplication', () => {
  let mockApplicationData

  beforeEach(() => {
    mockApplicationData = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [
        {
          title: 'Licence Information',
          sectionKey: 'licence',
          questionAnswers: [
            {
              question: 'Email address',
              questionKey: 'emailAddress',
              answer: {
                type: 'text',
                value: 'test@example.com',
                displayText: 'test@example.com'
              }
            },
            {
              question: 'Full name',
              questionKey: 'fullName',
              answer: {
                type: 'text',
                value: 'John Doe',
                displayText: 'John Doe'
              }
            }
          ]
        },
        {
          title: 'Origin Information',
          sectionKey: 'origin',
          questionAnswers: [
            {
              question: 'Origin type',
              questionKey: 'originType',
              answer: {
                type: 'radio',
                value: 'unrestricted-farm',
                displayText: 'Unrestricted Farm'
              }
            },
            {
              question: 'On or off farm',
              questionKey: 'onOffFarm',
              answer: {
                type: 'radio',
                value: 'off',
                displayText: 'Off Farm'
              }
            },
            {
              question: 'CPH Number',
              questionKey: 'cphNumber',
              answer: {
                type: 'text',
                value: '12/345/6789',
                displayText: '12/345/6789'
              }
            }
          ]
        },
        {
          title: 'Destination Information',
          sectionKey: 'destination',
          questionAnswers: [
            {
              question: 'Destination type',
              questionKey: 'destinationType',
              answer: {
                type: 'radio',
                value: 'tb-restricted-farm',
                displayText: 'TB Restricted Farm'
              }
            },
            {
              question: 'Destination Farm CPH',
              questionKey: 'destinationFarmCph',
              answer: {
                type: 'text',
                value: '98/765/4321',
                displayText: '98/765/4321'
              }
            }
          ]
        }
      ]
    }
  })

  describe('emailAddress', () => {
    it('should return email address from licence section', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.emailAddress).toBe('test@example.com')
    })

    it('should return undefined when licence section does not exist', () => {
      mockApplicationData.sections = []
      const application = new TbApplication(mockApplicationData)

      expect(application.emailAddress).toBeUndefined()
    })

    it('should return undefined when emailAddress question does not exist', () => {
      mockApplicationData.sections.at(0).questionAnswers = []
      const application = new TbApplication(mockApplicationData)

      expect(application.emailAddress).toBeUndefined()
    })
  })

  describe('applicantName', () => {
    it('should return full name from licence section', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.applicantName).toBe('John Doe')
    })

    it('should return empty string when licence section does not exist', () => {
      mockApplicationData.sections = []
      const application = new TbApplication(mockApplicationData)

      expect(application.applicantName).toBe('')
    })

    it('should return empty string when fullName question does not exist', () => {
      mockApplicationData.sections.at(0).questionAnswers = []
      const application = new TbApplication(mockApplicationData)

      expect(application.applicantName).toBe('')
    })
  })

  describe('isTbRestricted', () => {
    it('should return true for tb-restricted-farm', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('tb-restricted-farm')).toBe(true)
    })

    it('should return true for zoo', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('zoo')).toBe(true)
    })

    it('should return true for lab', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('lab')).toBe(true)
    })

    it('should return true for other', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('other')).toBe(true)
    })

    it('should return false for unrestricted-farm', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('unrestricted-farm')).toBe(false)
    })

    it('should return false for market', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.isTbRestricted('market')).toBe(false)
    })
  })

  describe('licenceType', () => {
    it('should return TB15 for unrestricted origin to restricted destination', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('TB15')
    })

    it('should return TB16 for restricted origin to restricted destination', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'originType'
        ).answer.value = 'tb-restricted-farm'
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('TB16')
    })

    it('should return TB16e for restricted origin to dedicated sale destination', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'originType'
        ).answer.value = 'tb-restricted-farm'
      mockApplicationData.sections
        .at(2)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'destinationType'
        ).answer.value = 'dedicated-sale'
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB16e for AFU origin to slaughter destination', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'originType'
        ).answer.value = 'afu'
      mockApplicationData.sections
        .at(2)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'destinationType'
        ).answer.value = 'slaughter'
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB24c for restricted origin to slaughter destination', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'originType'
        ).answer.value = 'tb-restricted-farm'
      mockApplicationData.sections
        .at(2)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'destinationType'
        ).answer.value = 'slaughter'
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('TB24c')
    })

    it('should return empty string for unmatched combinations', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'originType'
        ).answer.value = 'market'
      mockApplicationData.sections
        .at(2)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'destinationType'
        ).answer.value = 'market'
      const application = new TbApplication(mockApplicationData)

      expect(application.licenceType).toBe('')
    })
  })

  describe('requesterCphNumber', () => {
    it('should return destination CPH when on farm', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'onOffFarm'
        ).answer.value = 'on'
      const application = new TbApplication(mockApplicationData)

      expect(application.requesterCphNumber).toBe('98/765/4321')
    })

    it('should return origin CPH when off farm', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.requesterCphNumber).toBe('12/345/6789')
    })

    it('should return empty string when origin section does not exist', () => {
      mockApplicationData.sections = mockApplicationData.sections.filter(
        (s) => s.sectionKey !== 'origin'
      )
      const application = new TbApplication(mockApplicationData)

      expect(application.requesterCphNumber).toBe('')
    })

    it('should return empty string when destination section does not exist', () => {
      mockApplicationData.sections
        .at(1)
        .questionAnswers.find(
          (qa) => qa.questionKey === 'onOffFarm'
        ).answer.value = 'on'
      mockApplicationData.sections = mockApplicationData.sections.filter(
        (s) => s.sectionKey !== 'destination'
      )
      const application = new TbApplication(mockApplicationData)

      expect(application.requesterCphNumber).toBe('')
    })

    it('should return empty string when CPH questions do not exist', () => {
      mockApplicationData.sections.at(1).questionAnswers =
        mockApplicationData.sections
          .at(1)
          .questionAnswers.filter((qa) => qa.questionKey !== 'cphNumber')
      mockApplicationData.sections.at(2).questionAnswers =
        mockApplicationData.sections
          .at(2)
          .questionAnswers.filter(
            (qa) => qa.questionKey !== 'destinationFarmCph'
          )
      const application = new TbApplication(mockApplicationData)

      expect(application.requesterCphNumber).toBe('')
    })
  })

  describe('inheritance', () => {
    it('should inherit from Application class', () => {
      const application = new TbApplication(mockApplicationData)

      expect(application.journeyId).toBe(
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND'
      )
      expect(typeof application.get).toBe('function')
    })
  })
})
