import { createSharepointItem, fields } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'
import {
  destinationAddress,
  destinationCph,
  destinationSection,
  destinationType,
  howManyAnimals,
  howManyAnimalsMaximum,
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
  const originCphNumber = '12/123/1234'
  const firstName = 'Bob'
  const lastName = 'Barry'
  const originAddressLine1 = '1 the road'
  const originAddressTown = 'Townhamlet'
  const originAddressPostcode = 'AA10 1AA'

  const destinationCphNumber = '98/987/9876'
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
    originCph(originCphNumber),
    originAddressQuestion
  ])

  const onFarmOrigin = originSection([
    onOffFarm('on'),
    originType('tb-restricted-farm'),
    originCph(originCphNumber),
    originAddressQuestion
  ])

  const destination = destinationSection([
    destinationType('slaughter'),
    destinationAddress({
      addressLine1: destinationAddressLine1,
      addressTown: destinationAddressTown,
      addressPostcode: destinationAddressPostcode
    }),
    destinationCph(destinationCphNumber),
    reasonForMovement('routineRestocking'),
    howManyAnimals('62')
  ])

  const licence = licenceSection([keeperName({ firstName, lastName })])

  it('should construct expected fields for off the farm', () => {
    const application = {
      sections: [offFarmOrigin, licence, destination]
    }

    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Title: originCphNumber,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital',
      ApplicationSubmittedby: 'Owner/Keeper - Origin',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      DestinationCPH: destinationCphNumber,
      DestinationAddress_x0028_FirstLi: destinationAddressLine1,
      NumberofCattle: '62',
      UrgentWelfare: false,
      AFUtoAFU: false
    })
  })

  it('should construct expected fields for on the farm & a welfare case', () => {
    const application = {
      sections: [onFarmOrigin, licence, destination]
    }
    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Title: destinationCphNumber,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital',
      ApplicationSubmittedby: 'Owner/Keeper - Destination',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      DestinationCPH: destinationCphNumber,
      DestinationAddress_x0028_FirstLi: destinationAddressLine1,
      UrgentWelfare: false,
      NumberofCattle: '62',
      AFUtoAFU: false
    })
  })

  it('should return the desired value for a welfare', () => {
    const application = {
      sections: [destinationSection([reasonForMovement('welfare')])]
    }

    expect(fields(application, reference).UrgentWelfare).toBe(true)
  })

  it('should return the desired value for AFU -> AFU', () => {
    const application = {
      sections: [
        originSection([originType('afu')]),
        destinationSection([destinationType('afu')])
      ]
    }

    expect(fields(application, reference).AFUtoAFU).toBe(true)
  })

  it('should extract the maximum number of cattle if total number is not available', () => {
    const application = {
      sections: [destinationSection([howManyAnimalsMaximum('50')])]
    }

    expect(fields(application, reference).NumberofCattle).toBe('50')
  })

  it('should prefer the total number of cattle if both are present (not a case we should encounter)', () => {
    const application = {
      sections: [
        destinationSection([howManyAnimals('20'), howManyAnimalsMaximum('50')])
      ]
    }

    expect(fields(application, reference).NumberofCattle).toBe('20')
  })
})
