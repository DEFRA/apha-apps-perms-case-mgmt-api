import { sendToCaseManagement } from '../../connectors/integration-bridge/index.js'
import { createApplication } from '../data-extract/data-extract.js'
import { processApplication } from './case-management.js'

jest.mock('../../connectors/integration-bridge/index.js', () => ({
  sendToCaseManagement: jest.fn()
}))

const mockSendToCaseManagement = /** @type {jest.Mock} */ (sendToCaseManagement)

const testReferenceNumber = 'TB-1234-5678'

const mockApplication = createApplication({
  journeyId: 'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
  sections: []
})

describe('processApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send the payload and reference to case management', async () => {
    mockSendToCaseManagement.mockResolvedValue({ caseId: 'CASE-123' })

    const response = await processApplication(
      mockApplication,
      testReferenceNumber
    )

    expect(sendToCaseManagement).toHaveBeenCalledWith(
      mockApplication,
      testReferenceNumber
    )
    expect(response).toBeUndefined()
  })

  it('should propagate an error if sendToCaseManagement rejects', async () => {
    mockSendToCaseManagement.mockRejectedValue(
      new Error('Request failed (500): case-management')
    )

    await expect(
      processApplication(mockApplication, testReferenceNumber)
    ).rejects.toThrow('Request failed (500): case-management')
  })
})
