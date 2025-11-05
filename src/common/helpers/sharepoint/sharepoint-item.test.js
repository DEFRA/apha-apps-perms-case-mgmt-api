import { createSharepointItem, fields } from './sharepoint-item.js'
import * as sharepoint from '../../connectors/sharepoint/sharepoint.js'
import {
  additionalInfo,
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
  originType
} from '../../test-helpers/application.js'
import { spyOnConfig } from '../../test-helpers/config.js'

const application = {
  journeyId: 'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
  sections: []
}
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
  const siteName = 'DemoSite'
  const folderPath = 'Digital Applications/Test/TB25'
  const siteBaseUrl = 'https://sometenant.sharepoint.com'
  afterAll(jest.restoreAllMocks)

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
    howManyAnimals('62')
  ])

  const licence = licenceSection([keeperName({ firstName, lastName })])
  const sharepointPath = `/sites/${siteName}/Supporting Materials/${folderPath}/${reference}`
  const supportingMaterialLink = `${siteBaseUrl}/sites/${siteName}/Supporting%20Materials/Forms/AllItems.aspx?id=${encodeURIComponent(sharepointPath)}`

  const supportingMaterial = `<a href=${supportingMaterialLink} target="_blank">Supporting Material</a>`

  it('should construct expected fields for off the farm', () => {
    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [offFarmOrigin, licence, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Title: originCphNumber,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital (Automatically Receipted)',
      ApplicationSubmittedby: 'Owner/Keeper - Origin',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      OriginCPH: '12/123/1234',
      DestinationCPH: destinationCphNumber,
      Destination_x0020_Name: null,
      DestinationAddress_x0028_FirstLi: destinationAddressLine1,
      NumberofCattle: '62',
      SupportingMaterial: supportingMaterial
    })
  })

  it('should construct expected fields for on the farm', () => {
    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [onFarmOrigin, licence, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Title: destinationCphNumber,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital (Automatically Receipted)',
      ApplicationSubmittedby: 'Owner/Keeper - Destination',
      Name: null,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      OriginCPH: '12/123/1234',
      DestinationCPH: destinationCphNumber,
      Destination_x0020_Name: `${firstName} ${lastName}`,
      DestinationAddress_x0028_FirstLi: destinationAddressLine1,
      NumberofCattle: '62',
      SupportingMaterial: supportingMaterial
    })
  })

  it('should extract the maximum number of cattle if total number is not available', () => {
    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [destinationSection([howManyAnimalsMaximum('50')])]
    }

    expect(fields(application, reference).NumberofCattle).toBe('50')
  })

  it('should prefer the total number of cattle if both are present (not a case we should encounter)', () => {
    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [
        destinationSection([howManyAnimals('20'), howManyAnimalsMaximum('50')])
      ]
    }

    expect(fields(application, reference).NumberofCattle).toBe('20')
  })

  describe('additionalInfo field (Notes)', () => {
    it('should include plain text additional info without modification', () => {
      const plainTextInfo = 'Animals require special handling'
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [destinationSection([additionalInfo(plainTextInfo)])]
      }

      const result = fields(application, reference)

      expect(result.Notes).toBe(plainTextInfo)
    })

    it('should escape HTML link tags in additional info', () => {
      const htmlLink = '<a href="https://example.com">Click here</a>'
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [destinationSection([additionalInfo(htmlLink)])]
      }

      const result = fields(application, reference)

      expect(result.Notes).toBe(
        '&lt;a href=&quot;https://example.com&quot;&gt;Click here&lt;/a&gt;'
      )
      expect(result.Notes).not.toContain('<a')
      expect(result.Notes).not.toContain('</a>')
      expect(result.Notes).toContain('&lt;')
      expect(result.Notes).toContain('&gt;')
    })

    it('should escape script tags in additional info', () => {
      const scriptTag = '<script>alert("XSS")</script>'
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [destinationSection([additionalInfo(scriptTag)])]
      }

      const result = fields(application, reference)

      expect(result.Notes).toBe(
        '&lt;script&gt;alert\\(&quot;XSS&quot;\\)&lt;/script&gt;'
      )
      expect(result.Notes).not.toContain('<script')
    })

    it('should escape HTML special characters in additional info', () => {
      const specialChars = 'Use < and > symbols, not & or " or \' characters'
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [destinationSection([additionalInfo(specialChars)])]
      }

      const result = fields(application, reference)

      expect(result.Notes).toBe(
        'Use &lt; and &gt; symbols, not &amp; or &quot; or &#39; characters'
      )
    })

    it('should escape markdown link syntax', () => {
      const markdownLink = '[Click here](https://example.com)'
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [destinationSection([additionalInfo(markdownLink)])]
      }

      const result = fields(application, reference)

      expect(result.Notes).toBe('\\[Click here\\]\\(https://example.com\\)')
      expect(result.Notes).not.toContain('[Click here](')
    })
  })
})
