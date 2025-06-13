import { createSharepointItem } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'

describe('createSharepointItem', () => {
  const mockAddItem = jest
    .spyOn(sharepoint, 'addItem')
    .mockResolvedValue(undefined)

  afterAll(jest.restoreAllMocks)

  it('should set the application reference number correctly', async () => {
    const application = { sections: [] }
    const reference = 'TB-1234-ABCD'

    await createSharepointItem(application, reference)

    expect(mockAddItem).toHaveBeenCalledWith({
      Application_x0020_Reference_x002: reference
    })
  })
})
