import { createSharepointItem, fields } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'
import {
  destinationSection,
  destinationType,
  keeperName,
  licenceSection,
  onOffFarm,
  originAddress,
  originCph,
  originSection,
  originType,
  reasonForMovement
} from '../../test-helpers/application.js'

const application = { sections: [] }
const reference = 'TB-1234-ABCD'

describe('createSharepointItem', () => {
  const mockAddItem = jest
    .spyOn(sharepoint, 'addItem')
    .mockResolvedValue(undefined)

  afterAll(jest.restoreAllMocks)

  it('should pass through the expected fields correctly', async () => {
    await createSharepointItem(application, reference)

    expect(mockAddItem).toHaveBeenCalledWith(fields(application, reference))
  })

  it('should propagate errors from the sharepoint connector', async () => {
    const error = new Error('Item creation failed')
    mockAddItem.mockRejectedValue(error)

    expect(createSharepointItem(application, reference)).rejects.toThrow(
      'Item creation failed'
    )
  })
})

describe('fields', () => {
  const cphNumber = '12/123/1234'
  const firstName = 'Bob'
  const lastName = 'Barry'
  const addressLine1 = '1 the road'
  const addressTown = 'Townhamlet'
  const addressPostcode = 'AA10 1AA'

  const onFarmOrigin = originSection([
    onOffFarm('off'),
    originType('tb-restricted-farm'),
    originCph(cphNumber),
    originAddress({ addressLine1, addressTown, addressPostcode })
  ])

  const destination = destinationSection([
    destinationType('slaughter'),
    reasonForMovement('routineRestocking')
  ])

  const licence = licenceSection([keeperName({ firstName, lastName })])

  const application = {
    sections: [onFarmOrigin, licence, destination]
  }

  it('should construct expected fields for off the farm', () => {
    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital',
      ApplicationSubmittedby: 'Owner/Keeper - Origin',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: addressLine1,
      Licence: 'TB24c',
      UrgentWelfare: 'No'
    })
  })
})
