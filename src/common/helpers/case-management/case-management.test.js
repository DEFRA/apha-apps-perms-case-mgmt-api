import { sendToCaseManagement } from '../../connectors/integration-bridge/index.js'
import { caseManagementApplicationHandler } from './case-management.js'

jest.mock('../../connectors/integration-bridge/index.js', () => ({
  sendToCaseManagement: jest.fn()
}))

const mockSendToCaseManagement = /** @type {jest.Mock} */ (sendToCaseManagement)

const testReferenceNumber = 'TB-1234-5678'

const mockRequest = {
  payload: {
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
    sections: []
  }
}

describe('caseManagementApplicationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send the payload and reference to case management', async () => {
    mockSendToCaseManagement.mockResolvedValue({ caseId: 'CASE-123' })

    const response = await caseManagementApplicationHandler(
      mockRequest,
      testReferenceNumber
    )

    expect(sendToCaseManagement).toHaveBeenCalledWith(
      mockRequest.payload,
      testReferenceNumber
    )
    expect(response).toBeUndefined()
  })

  it('should propagate an error if sendToCaseManagement rejects', async () => {
    mockSendToCaseManagement.mockRejectedValue(
      new Error('Request failed (500): case-management')
    )

    await expect(
      caseManagementApplicationHandler(mockRequest, testReferenceNumber)
    ).rejects.toThrow('Request failed (500): case-management')
  })
})
