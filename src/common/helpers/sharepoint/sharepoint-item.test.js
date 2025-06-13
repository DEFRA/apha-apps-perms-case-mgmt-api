import { createSharepointItem, fields } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'
import {
  destinationSection,
  destinationType,
  originType
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

  /** @type {import('../data-extract/data-extract.js').SectionData} */
  const onFarmOrigin = {
    sectionKey: 'origin',
    title: 'Movement origin',
    questionAnswers: [
      {
        question: 'Are the animals moving off of or on to the premises?',
        questionKey: 'onOffFarm',
        answer: {
          type: 'radio',
          value: 'off',
          displayText: 'On to the farm or premises'
        }
      },
      originType('tb-restricted-farm'),
      {
        question: 'What is the CPH number of the farm?',
        questionKey: 'cphNumber',
        answer: {
          type: 'text',
          value: cphNumber,
          displayText: cphNumber
        }
      },
      {
        question: 'What is the address of the origin farm?',
        questionKey: 'address',
        answer: {
          type: 'address',
          value: {
            addressLine1,
            addressTown,
            addressPostcode
          },
          displayText: [addressLine1, addressTown, addressPostcode].join('\n')
        }
      }
    ]
  }

  const destination = destinationSection([destinationType('slaughter')])

  /** @type {import('../data-extract/data-extract.js').SectionData} */
  const licence = {
    sectionKey: 'licence',
    title: 'Receiving the licence',
    questionAnswers: [
      {
        question: 'What is the full name of the keeper of the animals?',
        questionKey: 'fullName',
        answer: {
          type: 'name',
          value: {
            firstName,
            lastName
          },
          displayText: `${firstName} ${lastName}`
        }
      }
    ]
  }
  /** @type {import('../data-extract/data-extract.js').ApplicationData} */
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
      Licence: 'TB24c'
    })
  })
})
