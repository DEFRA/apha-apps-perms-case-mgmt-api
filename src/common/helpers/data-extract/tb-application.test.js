import { Application } from './application.js'
import { TbApplication } from './tb-application.js'

// Test data constants
const BASE_APPLICATION_DATA = {
  journeyId: 'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
  sections: []
}

const LICENCE_SECTION_BASE = {
  title: 'Licence Information',
  sectionKey: 'licence',
  questionAnswers: []
}

const ORIGIN_SECTION_BASE = {
  title: 'Origin Information',
  sectionKey: 'origin',
  questionAnswers: []
}

const DESTINATION_SECTION_BASE = {
  title: 'Destination Information',
  sectionKey: 'destination',
  questionAnswers: []
}

const EMAIL_ADDRESS_QUESTION = {
  question: 'Email address',
  questionKey: 'emailAddress',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'test@example.com',
    displayText: 'test@example.com'
  }
}

const FULL_NAME_QUESTION = {
  question: 'Full name',
  questionKey: 'fullName',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: 'John Doe',
    displayText: 'John Doe'
  }
}

const ORIGIN_TYPE_QUESTION = (value, displayText = value) => ({
  question: 'Origin type',
  questionKey: 'originType',
  answer: {
    type: /** @type {'radio'} */ ('radio'),
    value,
    displayText
  }
})

const DESTINATION_TYPE_QUESTION = (value, displayText = value) => ({
  question: 'Destination type',
  questionKey: 'destinationType',
  answer: {
    type: /** @type {'radio'} */ ('radio'),
    value,
    displayText
  }
})

const ON_OFF_FARM_QUESTION = (value, displayText = value) => ({
  question: 'On or off farm',
  questionKey: 'onOffFarm',
  answer: {
    type: /** @type {'radio'} */ ('radio'),
    value,
    displayText
  }
})

const ORIGIN_CPH_QUESTION = (cphNumber) => ({
  question: 'CPH Number',
  questionKey: 'cphNumber',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: cphNumber,
    displayText: cphNumber
  }
})

const DESTINATION_CPH_QUESTION = (cphNumber) => ({
  question: 'Destination Farm CPH',
  questionKey: 'destinationFarmCph',
  answer: {
    type: /** @type {'text'} */ ('text'),
    value: cphNumber,
    displayText: cphNumber
  }
})

describe('TbApplication', () => {
  it('should be an instance of ExoticsApplication', () => {
    const application = new TbApplication(BASE_APPLICATION_DATA)
    expect(application).toBeInstanceOf(TbApplication)
    expect(application).toBeInstanceOf(Application)
  })

  describe('emailAddress', () => {
    it('should return email address from licence section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [EMAIL_ADDRESS_QUESTION]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.emailAddress).toBe('test@example.com')
    })

    it('should return undefined when licence section does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new TbApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })

    it('should return undefined when emailAddress question does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.emailAddress).toBeUndefined()
    })
  })

  describe('applicantName', () => {
    it('should return full name from licence section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [FULL_NAME_QUESTION]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.applicantName).toBe('John Doe')
    })

    it('should return empty string when fullName question does not exist', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.applicantName).toBe('')
    })
  })

  describe('isTbRestricted', () => {
    let application

    beforeEach(() => {
      const applicationData = { ...BASE_APPLICATION_DATA }
      application = new TbApplication(applicationData)
    })

    it('should return true for tb-restricted-farm', () => {
      expect(application.isTbRestricted('tb-restricted-farm')).toBe(true)
    })

    it('should return true for zoo', () => {
      expect(application.isTbRestricted('zoo')).toBe(true)
    })

    it('should return true for lab', () => {
      expect(application.isTbRestricted('lab')).toBe(true)
    })

    it('should return true for other', () => {
      expect(application.isTbRestricted('other')).toBe(true)
    })

    it('should return false for unrestricted-farm', () => {
      expect(application.isTbRestricted('unrestricted-farm')).toBe(false)
    })

    it('should return false for market', () => {
      expect(application.isTbRestricted('market')).toBe(false)
    })

    it('should return false for after-import-location', () => {
      expect(application.isTbRestricted('after-import-location')).toBe(false)
    })

    it('should return false for slaughter', () => {
      expect(application.isTbRestricted('slaughter')).toBe(false)
    })

    it('should return false for unknown premise type', () => {
      expect(application.isTbRestricted('unknown-type')).toBe(false)
    })
  })

  describe('licenceType', () => {
    it('should return TB15 for unrestricted origin to restricted destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('unrestricted-farm')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('tb-restricted-farm')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB15')
    })

    it('should return TB15 for market origin to restricted destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('market')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('zoo')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB15')
    })

    it('should return TB16 for restricted origin to restricted destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('tb-restricted-farm')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('lab')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB16')
    })

    it('should return TB16e for restricted origin to dedicated sale destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('tb-restricted-farm')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('dedicated-sale')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB16e for restricted origin to afu destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('zoo')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('afu')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB16e for afu origin to slaughter destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('afu')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('slaughter')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB16e for afu origin to afu destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('afu')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('afu')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB16e')
    })

    it('should return TB24c for restricted origin to slaughter destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('tb-restricted-farm')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('slaughter')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('TB24c')
    })

    it('should return empty string for unrestricted origin to unrestricted destination', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('market')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('unrestricted-farm')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('')
    })

    it('should return empty string when origin section is missing', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_TYPE_QUESTION('tb-restricted-farm')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('')
    })

    it('should return empty string when destination section is missing', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ORIGIN_TYPE_QUESTION('unrestricted-farm')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.licenceType).toBe('')
    })
  })

  describe('requesterCphNumber', () => {
    it('should return destination CPH when movement is on farm (to farm)', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [
              ON_OFF_FARM_QUESTION('on'),
              ORIGIN_CPH_QUESTION('12/345/6789')
            ]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_CPH_QUESTION('98/765/4321')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('98/765/4321')
    })

    it('should return origin CPH when movement is off farm (from farm)', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [
              ON_OFF_FARM_QUESTION('off'),
              ORIGIN_CPH_QUESTION('12/345/6789')
            ]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_CPH_QUESTION('98/765/4321')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('12/345/6789')
    })

    it('should return empty string when origin section is missing', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_CPH_QUESTION('98/765/4321')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('')
    })

    it('should return empty string when destination section is missing', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [
              ON_OFF_FARM_QUESTION('on'),
              ORIGIN_CPH_QUESTION('12/345/6789')
            ]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('')
    })

    it('should return empty string when CPH numbers are missing', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [ON_OFF_FARM_QUESTION('on')]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: []
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('')
    })

    it('should handle null CPH answer gracefully', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [
              ON_OFF_FARM_QUESTION('off'),
              {
                question: 'CPH Number',
                questionKey: 'cphNumber',
                answer: /** @type {any} */ (null)
              }
            ]
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [DESTINATION_CPH_QUESTION('98/765/4321')]
          }
        ]
      }

      const application = new TbApplication(applicationData)

      expect(application.requesterCphNumber).toBe('')
    })
  })

  describe('inheritance from Application class', () => {
    it('should inherit journeyId property from parent Application class', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        journeyId: 'TEST_JOURNEY_ID'
      }

      const application = new TbApplication(applicationData)

      expect(application.journeyId).toBe('TEST_JOURNEY_ID')
    })

    it('should inherit get method from parent Application class', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...LICENCE_SECTION_BASE,
            questionAnswers: [EMAIL_ADDRESS_QUESTION]
          }
        ]
      }

      const application = new TbApplication(applicationData)
      const licenceSection = application.get('licence')

      expect(licenceSection).toBeDefined()
      expect(licenceSection?.get('emailAddress')).toEqual(
        EMAIL_ADDRESS_QUESTION
      )
    })

    it('should return undefined when getting non-existent section', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new TbApplication(applicationData)

      expect(application.get('nonExistentSection')).toBeUndefined()
    })
  })

  describe('getRadioValue method (indirectly tested)', () => {
    it('should handle missing section gracefully in licenceType calculation', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: []
      }

      const application = new TbApplication(applicationData)

      // This indirectly tests getRadioValue returning empty string for missing sections
      expect(application.licenceType).toBe('')
    })

    it('should handle missing question gracefully in licenceType calculation', () => {
      const applicationData = {
        ...BASE_APPLICATION_DATA,
        sections: [
          {
            ...ORIGIN_SECTION_BASE,
            questionAnswers: [] // Missing originType
          },
          {
            ...DESTINATION_SECTION_BASE,
            questionAnswers: [] // Missing destinationType
          }
        ]
      }

      const application = new TbApplication(applicationData)

      // This indirectly tests getRadioValue returning empty string for missing questions
      expect(application.licenceType).toBe('')
    })
  })
})
