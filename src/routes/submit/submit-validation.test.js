import { isValidRequest, isValidPayload } from './submit-validation.js'
import { ApplicationSchema } from './submit-payload-schema.js'
import { jest } from '@jest/globals'

/** @type {object} */
let mockRequest = { logger: { warn: jest.fn(), info: jest.fn() } }

const testEmailAddress = 'test@example.com'
const testFullName = 'Full Name'
const emailAddressQuestion = {
  question: 'Email address',
  questionKey: 'emailAddress',
  answer: {
    type: 'text',
    value: testEmailAddress,
    displayText: testEmailAddress
  }
}
const fullNameQuestion = {
  question: 'Full Name',
  questionKey: 'fullName',
  answer: {
    type: 'name',
    value: { firstName: 'Full', lastName: 'Name' },
    displayText: testFullName
  }
}
const validLicenceSection = {
  title: 'Licence',
  sectionKey: 'licence',
  questionAnswers: [emailAddressQuestion, fullNameQuestion]
}
const licenceSectionWithMissingEmail = {
  ...validLicenceSection,
  questionAnswers: [fullNameQuestion]
}
const licenceSectionWithMissingFullName = {
  ...validLicenceSection,
  questionAnswers: [emailAddressQuestion]
}
const licenceSectionWithMissingEmailAndFullName = {
  ...validLicenceSection,
  questionAnswers: []
}

describe('submit-validation', () => {
  afterEach(jest.clearAllMocks)

  describe('isValidRequest', () => {
    it('should return true for valid Content-Type header', () => {
      mockRequest = {
        ...mockRequest,
        headers: { 'content-type': 'application/json' }
      }
      const result = isValidRequest(mockRequest)
      expect(result).toBe(true)
      expect(mockRequest.logger.warn).not.toHaveBeenCalled()
    })

    it('should return false and log error for missing Content-Type header', () => {
      mockRequest = {
        ...mockRequest,
        headers: {}
      }
      const result = isValidRequest(mockRequest)
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid request. Content-Type header is missing'
      )
    })

    it('should return false and log error for invalid Content-Type header', () => {
      mockRequest = {
        ...mockRequest,
        headers: { 'content-type': 'text/plain' }
      }
      const result = isValidRequest(mockRequest)
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid request. Content-Type header does not include application/json'
      )
    })
  })

  describe('isValidPayload', () => {
    it('should return true for valid payload', () => {
      mockRequest = {
        ...mockRequest,
        payload: {
          journeyId:
            'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
          journeyVersion: { major: 1, minor: 0 },
          sections: [validLicenceSection]
        }
      }
      const result = isValidPayload(mockRequest)
      expect(result).toBe(true)
      expect(mockRequest.logger.warn).not.toHaveBeenCalled()
    })

    it('should return false and log error for missing emailAddress', () => {
      mockRequest = {
        ...mockRequest,
        payload: {
          journeyId:
            'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
          journeyVersion: { major: 1, minor: 0 },
          sections: [licenceSectionWithMissingEmail]
        }
      }
      const result = isValidPayload(mockRequest)
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid payload. emailAddress is missing in the payload'
      )
    })

    it('should return false and log error for missing fullName', () => {
      mockRequest = {
        ...mockRequest,
        payload: {
          journeyId: 'journeyId',
          journeyVersion: { major: 1, minor: 0 },
          sections: [licenceSectionWithMissingFullName]
        }
      }
      const result = isValidPayload(mockRequest)
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid payload. fullName is missing in the payload'
      )
    })

    it('should return false and log errors for missing emailAddress and fullName', () => {
      mockRequest = {
        ...mockRequest,
        payload: {
          journeyId: 'journeyId',
          journeyVersion: { major: 1, minor: 0 },
          sections: [licenceSectionWithMissingEmailAndFullName]
        }
      }
      const result = isValidPayload(mockRequest)
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid payload. emailAddress is missing in the payload'
      )
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Invalid payload. fullName is missing in the payload'
      )
    })

    it('should return false and log schema validation errors if ApplicationSchema fails', () => {
      const validateMock = jest.spyOn(ApplicationSchema, 'validate')

      mockRequest = {
        ...mockRequest,
        payload: {}
      }

      const result = isValidPayload(mockRequest)

      expect(validateMock).toHaveBeenCalled()
      expect(result).toBe(false)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Schema validation failed: "journeyId" is required, "journeyVersion" is required, "sections" is required.'
      )
    })
  })
})
