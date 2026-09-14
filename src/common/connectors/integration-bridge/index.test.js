import Wreck from '@hapi/wreck'
import { config } from '../../../config.js'

import { sendToCaseManagement } from './index.js'

describe('Integration bridge API', () => {
  const CONFIG_VALUES = {
    baseUrl: 'http://integration-bridge',
    tokenUrl: 'http://integration-bridge/oauth2/token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    timeout: 5000
  }

  const MOCK_TOKEN = 'abc123'
  const TEST_PAYLOAD = {
    applicationReference: 'APP-123',
    status: 'submitted',
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
    sections: [
      {
        sectionKey: 'licence',
        questionAnswers: [
          {
            questionKey: 'emailAddress',
            answer: {
              type: 'text',
              value: 'test@example.com',
              displayText: 'test@example.com'
            }
          },
          {
            questionKey: 'yourName',
            answer: {
              type: 'name',
              value: { firstName: 'Jane', lastName: 'Smith' },
              displayText: 'Jane Smith'
            }
          }
        ]
      }
    ]
  }
  const TEST_APPLICANT = {
    type: 'guest',
    emailAddress: 'test@example.com',
    name: { firstName: 'Jane', lastName: 'Smith' }
  }
  const TEST_REFERENCE = 'APP-123'

  const originalConfigGet = config.get.bind(config)

  /**
   * @param {number} statusCode
   * @param {any} payload
   */
  const createMockResponse = (statusCode, payload) =>
    /** @type {any} */ ({
      res: { statusCode },
      payload: JSON.stringify(payload)
    })

  /**
   * @param {string} [accessToken]
   */
  const mockTokenResponse = (accessToken = MOCK_TOKEN) =>
    createMockResponse(200, { access_token: accessToken })

  /**
   * @param {any} data
   */
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(config, 'get').mockImplementation((name) => {
      if (name === 'integrationBridge') {
        return CONFIG_VALUES
      }
      return originalConfigGet(name)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('successful scenarios', () => {
    it('should request a token and submit the case', async () => {
      jest
        .spyOn(Wreck, 'post')
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce(createMockResponse(200, { caseId: 'CASE-123' }))

      const result = await sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)

      expect(Wreck.post).toHaveBeenNthCalledWith(1, CONFIG_VALUES.tokenUrl, {
        payload:
          'grant_type=client_credentials&client_id=client-id&client_secret=client-secret',
        headers: {
          Authorization: 'Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: CONFIG_VALUES.timeout
      })

      expect(Wreck.post).toHaveBeenNthCalledWith(
        2,
        `${CONFIG_VALUES.baseUrl}/case-management/case`,
        {
          payload: {
            ...TEST_PAYLOAD,
            applicationReferenceNumber: TEST_REFERENCE,
            applicant: TEST_APPLICANT
          },
          headers: {
            Authorization: `Bearer ${MOCK_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: CONFIG_VALUES.timeout
        }
      )

      expect(result).toEqual({ caseId: 'CASE-123' })
    })
  })

  describe('error scenarios - token request', () => {
    it('should reject when the token request fails', async () => {
      jest
        .spyOn(Wreck, 'post')
        .mockResolvedValueOnce(createMockResponse(503, {}))

      await expect(
        sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)
      ).rejects.toThrow(`Request failed (503): ${CONFIG_VALUES.tokenUrl}`)
    })

    it('should reject when access token is missing from response', async () => {
      jest
        .spyOn(Wreck, 'post')
        .mockResolvedValueOnce(createMockResponse(200, {}))

      await expect(
        sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)
      ).rejects.toThrow(
        'Integration bridge token response did not include an access token'
      )
    })

    it('should handle missing statusCode', async () => {
      jest.spyOn(Wreck, 'post').mockResolvedValueOnce(
        /** @type {any} */ ({
          res: {},
          payload: JSON.stringify({})
        })
      )

      await expect(
        sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)
      ).rejects.toThrow(
        'Integration bridge token response did not include an access token'
      )
    })
  })

  describe('error scenarios - case request', () => {
    it('should reject when the case request fails', async () => {
      jest
        .spyOn(Wreck, 'post')
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce(createMockResponse(400, {}))

      await expect(
        sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)
      ).rejects.toThrow(
        `Request failed (400): ${CONFIG_VALUES.baseUrl}/case-management/case`
      )
    })

    it('should return the case response when statusCode is missing', async () => {
      jest
        .spyOn(Wreck, 'post')
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce(
          /** @type {any} */ ({
            res: {},
            payload: JSON.stringify({ caseId: 'CASE-123' })
          })
        )

      await expect(
        sendToCaseManagement(TEST_PAYLOAD, TEST_REFERENCE)
      ).resolves.toEqual({
        caseId: 'CASE-123'
      })
    })
  })
})
