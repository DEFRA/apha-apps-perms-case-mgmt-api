import { sendMessageToSQS } from '../../connectors/queue/sqs-producer.js'
import { createApplication } from '../data-extract/data-extract.js'
import { queueApplication } from './queue.js'
import { statusCodes } from '../../constants/status-codes.js'

jest.mock('../../connectors/queue/sqs-producer.js', () => ({
  sendMessageToSQS: jest.fn()
}))

const mockSendMessageToSQS = /** @type {jest.Mock} */ (sendMessageToSQS)

const testReference = 'TB-AAAA-BBBB'
const applicationData = {
  journeyId: 'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
  sections: []
}
const application = createApplication(applicationData)

describe('Queue helper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send the application data and reference to SQS', async () => {
    mockSendMessageToSQS.mockResolvedValue(undefined)

    const result = await queueApplication(application, testReference)

    expect(mockSendMessageToSQS).toHaveBeenCalledWith(
      applicationData,
      testReference
    )
    expect(result).toBeUndefined()
  })

  it('should return an enqueueing error when sending to SQS fails', async () => {
    mockSendMessageToSQS.mockRejectedValue(new Error('SQS error'))

    const result = await queueApplication(application, testReference)

    expect(result).toEqual({
      error: {
        errorCode: 'MESSAGE_ENQUEUEING_FAILED',
        statusCode: statusCodes.serverError
      }
    })
  })
})
