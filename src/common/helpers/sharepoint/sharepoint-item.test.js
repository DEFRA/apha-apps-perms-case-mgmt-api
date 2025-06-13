import { createSharepointItem, fields } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'
import {
  destinationAddress,
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
  const originAddressLine1 = '1 the road'
  const originAddressTown = 'Townhamlet'
  const originAddressPostcode = 'AA10 1AA'

  const destinationAddressLine1 = '2 the street'
  const destinationAddressTown = 'Cityville'
  const destinationAddressPostcode = 'ZZ09 9ZZ'

  const originAddressQuestion = originAddress({
    addressLine1: originAddressLine1,
    addressTown: originAddressTown,
    addressPostcode: originAddressPostcode
  })

  const offFarmOrigin = originSection([
    onOffFarm('off'),
    originType('tb-restricted-farm'),
    originCph(cphNumber),
    originAddressQuestion
  ])

  const onFarmOrigin = originSection([
    onOffFarm('on'),
    originType('tb-restricted-farm'),
    originCph(cphNumber),
    originAddressQuestion
  ])

  const destination = destinationSection([
    destinationType('slaughter'),
    destinationAddress({
      addressLine1: destinationAddressLine1,
      addressTown: destinationAddressTown,
      addressPostcode: destinationAddressPostcode
    }),
    reasonForMovement('routineRestocking')
  ])

  const licence = licenceSection([keeperName({ firstName, lastName })])

  it('should construct expected fields for off the farm', () => {
    const application = {
      sections: [offFarmOrigin, licence, destination]
    }
    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital',
      ApplicationSubmittedby: 'Owner/Keeper - Origin',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      UrgentWelfare: 'No',
      AFUtoAFU: 'No'
    })
  })

  it('should construct expected fields for on the farm', () => {
    const application = {
      sections: [onFarmOrigin, licence, destination]
    }
    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital',
      ApplicationSubmittedby: 'Owner/Keeper - Destination',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: destinationAddressLine1,
      Licence: 'TB24c',
      UrgentWelfare: 'No',
      AFUtoAFU: 'No'
    })
  })
})
