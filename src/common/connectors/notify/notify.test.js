import { sendEmailToCaseWorker, sendEmailToApplicant } from './notify.js'
import Wreck from '@hapi/wreck'
import { config } from '../../../config.js'
import { statusCodes } from '../../constants/status-codes.js'

/**
 * @import { IncomingMessage } from 'node:http'
 */

const { ...notifyConfig } = config.get('notify')

jest.mock('./notify-token-utils.js', () => ({
  createToken: jest.fn().mockReturnValue('mocked-jwt-token')
}))

describe('sendEmailToCaseWorker', () => {
  const testData = {
    content: 'test',
    link_to_file: {
      file: 'base64encodedimage',
      filename: 'Biosecurity-map.jpg',
      confirm_email_before_download: true,
      retention_period: '1 week'
    }
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when the email is sent successfully', () => {
    const mockResponse = {}
    let wreckSpy

    beforeEach(() => {
      wreckSpy = jest.spyOn(Wreck, 'post').mockResolvedValue({
        res: /** @type {IncomingMessage} */ ({
          statusCode: 200
        }),
        payload: JSON.stringify(mockResponse)
      })
    })

    it('should send a notification successfully', async () => {
      const response = await sendEmailToCaseWorker(testData)

      const [url, options] = wreckSpy.mock.calls[0]
      const payload = options.payload

      expect(url).toBe(notifyConfig.url)

      expect(JSON.parse(payload ?? '')).toEqual({
        personalisation: testData,
        template_id: notifyConfig.caseDelivery.templateId,
        email_address: notifyConfig.caseDelivery.emailAddress
      })
      expect(options?.headers).toEqual({
        Authorization: 'Bearer mocked-jwt-token'
      })
      expect(options?.timeout).toBe(notifyConfig.timeout)
      expect(response).toEqual(mockResponse)
    })

    it('should substitute in an empty string if link_to_file is not provided', async () => {
      const testDataWithoutFile = { content: testData.content }

      const response = await sendEmailToCaseWorker(testDataWithoutFile)

      const [url, options] = wreckSpy.mock.calls[0]
      const payload = options.payload

      expect(url).toBe(notifyConfig.url)

      expect(JSON.parse(payload)).toEqual({
        personalisation: {
          ...testDataWithoutFile,
          link_to_file: ''
        },
        template_id: notifyConfig.caseDelivery.templateId,
        email_address: notifyConfig.caseDelivery.emailAddress
      })
      expect(options.headers).toEqual({
        Authorization: 'Bearer mocked-jwt-token'
      })
      expect(options?.timeout).toBe(notifyConfig.timeout)
      expect(response).toEqual(mockResponse)
    })
  })

  describe('when the notification fails to send', () => {
    it('should throw an error if the request times out', async () => {
      jest.spyOn(Wreck, 'post').mockRejectedValue({
        output: {
          statusCode: statusCodes.gatewayTimeout
        }
      })

      await expect(sendEmailToCaseWorker(testData)).rejects.toThrow(
        `Request to GOV.uk notify timed out after ${notifyConfig.timeout}ms`
      )
    })

    it('should throw an error if we get an http level error', async () => {
      const errors = JSON.stringify({
        statusCode: statusCodes.badRequest,
        errors: [
          {
            error: 'BadRequestError',
            message: "Can't send to this recipient using a team-only API key"
          },
          {
            error: 'BadRequestError',
            message:
              "Can't send to this recipient when service is in trial mode"
          }
        ]
      })

      jest.spyOn(Wreck, 'post').mockRejectedValue({
        data: {
          payload: {
            toString: jest.fn().mockReturnValue(errors)
          }
        }
      })

      await expect(sendEmailToCaseWorker(testData)).rejects.toThrow(
        `HTTP failure from GOV.uk notify: status ${statusCodes.badRequest} with the following errors: Can't send to this recipient using a team-only API key, Can't send to this recipient when service is in trial mode`
      )
    })

    it('should throw an error if we get a below-http level error', async () => {
      const errorMessage = 'any error'
      jest.spyOn(Wreck, 'post').mockRejectedValue({
        message: errorMessage
      })
      await expect(sendEmailToCaseWorker(testData)).rejects.toThrow(
        `Request to GOV.uk notify failed with error: ${errorMessage}`
      )
    })
  })
})

describe('sendEmailToApplicant', () => {
  const testData = {
    email: 'test@mail.com',
    fullName: 'Test User',
    reference: '123456789'
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when the email is sent successfully', () => {
    const mockResponse = {}
    let wreckSpy

    beforeEach(() => {
      wreckSpy = jest.spyOn(Wreck, 'post').mockResolvedValue({
        res: /** @type {IncomingMessage} */ ({
          statusCode: 200
        }),
        payload: JSON.stringify(mockResponse)
      })
    })

    it('should send a notification successfully', async () => {
      const response = await sendEmailToApplicant(testData)

      const [url, options] = wreckSpy.mock.calls[0]
      const payload = options.payload

      expect(url).toBe(notifyConfig.url)

      expect(JSON.parse(payload ?? '')).toEqual({
        personalisation: {
          applicant_name: testData.fullName,
          application_reference_number: testData.reference
        },
        email_address: testData.email,
        template_id: notifyConfig.applicantConfirmation.templateId
      })
      expect(options?.headers).toEqual({
        Authorization: 'Bearer mocked-jwt-token'
      })
      expect(options?.timeout).toBe(notifyConfig.timeout)
      expect(response).toEqual(mockResponse)
    })
  })

  describe('when the notification fails to send', () => {
    it('should throw an error if the request times out', async () => {
      jest.spyOn(Wreck, 'post').mockRejectedValue({
        output: {
          statusCode: statusCodes.gatewayTimeout
        }
      })

      await expect(sendEmailToApplicant(testData)).rejects.toThrow(
        `Request to GOV.uk notify timed out after ${notifyConfig.timeout}ms`
      )
    })

    it('should throw an error if we get an http level error', async () => {
      const errors = JSON.stringify({
        statusCode: statusCodes.badRequest,
        errors: [
          {
            error: 'BadRequestError',
            message: "Can't send to this recipient using a team-only API key"
          },
          {
            error: 'BadRequestError',
            message:
              "Can't send to this recipient when service is in trial mode"
          }
        ]
      })

      jest.spyOn(Wreck, 'post').mockRejectedValue({
        data: {
          payload: {
            toString: jest.fn().mockReturnValue(errors)
          }
        }
      })

      await expect(sendEmailToApplicant(testData)).rejects.toThrow(
        `HTTP failure from GOV.uk notify: status ${statusCodes.badRequest} with the following errors: Can't send to this recipient using a team-only API key, Can't send to this recipient when service is in trial mode`
      )
    })

    it('should throw an error if we get a below-http level error', async () => {
      const errorMessage = 'any error'
      jest.spyOn(Wreck, 'post').mockRejectedValue({
        message: errorMessage
      })
      await expect(sendEmailToApplicant(testData)).rejects.toThrow(
        `Request to GOV.uk notify failed with error: ${errorMessage}`
      )
    })
  })
})
