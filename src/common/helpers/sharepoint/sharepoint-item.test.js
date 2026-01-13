import {
  createSharepointItem,
  fields,
  validateKeyFactsPayload
} from './sharepoint-item.js'
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
  originType,
  yourName
} from '../../test-helpers/application.js'
import { spyOnConfig } from '../../test-helpers/config.js'

/** @import { FileAnswer } from '../data-extract/application.js' */

const mockLoggerWarn = jest.fn()

jest.mock('../logging/logger.js', () => ({
  createLogger: () => ({
    error: jest.fn(),
    warn: (...args) => mockLoggerWarn(...args),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(function () {
      return this
    })
  })
}))

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

  const additionalInfoText = 'Animals require special handling'
  const destination = destinationSection([
    destinationType('slaughter'),
    destinationAddress({
      addressLine1: destinationAddressLine1,
      addressTown: destinationAddressTown,
      addressPostcode: destinationAddressPostcode
    }),
    destinationCph(destinationCphNumber),
    howManyAnimals('62'),
    additionalInfo(additionalInfoText)
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
      Notes: additionalInfoText,
      OriginCPH: '12/123/1234',
      DestinationCPH: destinationCphNumber,
      Destination_x0020_Name: null,
      DestinationAddress_x0028_FirstLi: destinationAddressLine1,
      NumberofCattle: '62',
      SupportingMaterial: supportingMaterial
    })
  })

  it('should construct expected fields for on the farm with restricted origin', () => {
    const yourFirstName = 'Alice'
    const yourLastName = 'Jones'
    const licenceWithYourName = licenceSection([
      keeperName({ firstName, lastName }),
      yourName({ firstName: yourFirstName, lastName: yourLastName })
    ])

    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [onFarmOrigin, licenceWithYourName, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    expect(fields(application, reference)).toEqual({
      Application_x0020_Reference_x002: reference,
      Title: destinationCphNumber,
      Office: 'Polwhele',
      MethodofReceipt: 'Digital (Automatically Receipted)',
      ApplicationSubmittedby: 'Owner/Keeper - Destination',
      Name: `${firstName} ${lastName}`,
      FirstlineofAddress: originAddressLine1,
      Licence: 'TB24c',
      Notes: additionalInfoText,
      OriginCPH: '12/123/1234',
      DestinationCPH: destinationCphNumber,
      Destination_x0020_Name: `${yourFirstName} ${yourLastName}`,
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

  it('should handle on the farm with restricted origin when only yourName exists (no fullName)', () => {
    const yourFirstName = 'Alice'
    const yourLastName = 'Jones'
    const licenceWithOnlyYourName = licenceSection([
      yourName({ firstName: yourFirstName, lastName: yourLastName })
    ])

    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [onFarmOrigin, licenceWithOnlyYourName, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    const result = fields(application, reference)
    expect(result.Name).toBeUndefined()
    expect(result.Destination_x0020_Name).toBe(
      `${yourFirstName} ${yourLastName}`
    )
  })

  it('should handle on the farm with restricted origin when yourName is missing', () => {
    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [onFarmOrigin, licence, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    const result = fields(application, reference)
    expect(result.Name).toBe(`${firstName} ${lastName}`)
    expect(result.Destination_x0020_Name).toBeUndefined()
  })

  it('should construct expected fields for on the farm with unrestricted origin', () => {
    const onFarmUnrestrictedOrigin = originSection([
      onOffFarm('on'),
      originType('market'),
      originCph(originCphNumber),
      originAddressQuestion
    ])

    const application = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [onFarmUnrestrictedOrigin, licence, destination]
    }
    spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

    const result = fields(application, reference)
    expect(result.Name).toBeNull()
    expect(result.Destination_x0020_Name).toBe(`${firstName} ${lastName}`)
  })

  describe('keyFacts', () => {
    it('should use legacy approach even when keyFacts exists (soft launch)', () => {
      const application = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [],
        keyFacts: {
          licenceType: 'TB16',
          requester: 'destination',
          movementDirection: 'on',
          additionalInformation: 'additional information notes',
          numberOfCattle: 1,
          originCph: '12/345/6789',
          destinationCph: '12/345/0000',
          originAddress: {
            addressLine1: 'New XYZ',
            addressTown: 'MK',
            addressPostcode: 'MK5 6AA'
          },
          destinationAddress: {
            addressLine1: '12 WRONG',
            addressTown: 'Milton Keynes',
            addressPostcode: 'MK5 6BB'
          },
          originKeeperName: { firstName: 'Mike', lastName: 'Kilo' },
          destinationKeeperName: { firstName: 'TEST', lastName: 'USER' },
          requesterCph: '12/345/0000',
          biosecurityMaps: [
            'biosecurity-map/c79126dd-b3f7-499c-afad-12959fa95ff6/3ec67f40-9a24-41b6-acc7-a7397ae198a9'
          ]
        }
      }
      spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })

      const result = fields(application, reference)
      expect(result.Title).toBe('')
      expect(result.Licence).toBe('')
      expect(result.ApplicationSubmittedby).toBe('Owner/Keeper - Origin')
    })
  })

  describe('validateKeyFactsPayload', () => {
    const createBiosecurityMapSection = (path) => ({
      title: 'biosecurity-map',
      sectionKey: 'biosecurity-map',
      questionAnswers: [
        {
          question: 'Upload your biosecurity map',
          questionKey: 'upload-plan',
          /** @type {FileAnswer} */
          answer: {
            type: 'file',
            value: {
              path,
              skipped: false
            },
            displayText: ''
          }
        }
      ]
    })

    const createDestination = () =>
      destinationSection([
        destinationType('slaughter'),
        destinationAddress({
          addressLine1: destinationAddressLine1,
          addressTown: destinationAddressTown,
          addressPostcode: destinationAddressPostcode
        }),
        destinationCph(destinationCphNumber),
        howManyAnimals('62'),
        additionalInfo(additionalInfoText)
      ])

    const createKeyFacts = (biosecurityMaps = []) => ({
      licenceType: 'TB24c',
      requester: 'origin',
      movementDirection: 'off',
      additionalInformation: additionalInfoText,
      numberOfCattle: 62,
      originCph: originCphNumber,
      destinationCph: destinationCphNumber,
      originAddress: {
        addressLine1: originAddressLine1,
        addressTown: originAddressTown,
        addressPostcode: originAddressPostcode
      },
      destinationAddress: {
        addressLine1: destinationAddressLine1,
        addressTown: destinationAddressTown,
        addressPostcode: destinationAddressPostcode
      },
      originKeeperName: { firstName, lastName },
      destinationKeeperName: undefined,
      requesterCph: originCphNumber,
      biosecurityMaps
    })

    const createApplication = (sections, keyFacts) => ({
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections,
      keyFacts
    })

    beforeEach(() => {
      spyOnConfig('sharepoint', { siteName, folderPath, siteBaseUrl })
      mockLoggerWarn.mockClear()
    })

    it('should not log errors when keyFacts and legacy payloads match', () => {
      const biosecurityMapPath = 'biosecurity-map/path/to/file'
      const destination = createDestination()
      const biosecurityMapSection =
        createBiosecurityMapSection(biosecurityMapPath)
      const keyFacts = createKeyFacts([biosecurityMapPath])
      const application = createApplication(
        [offFarmOrigin, licence, destination, biosecurityMapSection],
        keyFacts
      )

      validateKeyFactsPayload(application, reference)

      expect(mockLoggerWarn).not.toHaveBeenCalled()
    })

    it('should not run validation when keyFacts is missing', () => {
      const destination = createDestination()
      const application = createApplication(
        [offFarmOrigin, licence, destination],
        undefined
      )

      expect(() =>
        validateKeyFactsPayload(application, reference)
      ).not.toThrow()
    })

    it('should log warning when biosecurity map paths differ', () => {
      const legacyBiosecurityMapPath = 'biosecurity-map/legacy-path.pdf'
      const keyFactsBiosecurityMapPath = 'biosecurity-map/keyfacts-path.pdf'
      const destination = createDestination()
      const biosecurityMapSection = createBiosecurityMapSection(
        legacyBiosecurityMapPath
      )
      const keyFacts = createKeyFacts([keyFactsBiosecurityMapPath])
      const application = createApplication(
        [offFarmOrigin, licence, destination, biosecurityMapSection],
        keyFacts
      )

      validateKeyFactsPayload(application, reference)

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        `${reference} key facts matching error: biosecurity map keys differ (keyFacts: "${keyFactsBiosecurityMapPath}", existing: "${legacyBiosecurityMapPath}")`
      )
    })

    it('should log warning when keyFacts has biosecurity map but legacy does not', () => {
      const keyFactsBiosecurityMapPath = 'biosecurity-map/keyfacts-path.pdf'
      const destination = createDestination()
      const keyFacts = createKeyFacts([keyFactsBiosecurityMapPath])
      const application = createApplication(
        [offFarmOrigin, licence, destination],
        keyFacts
      )

      validateKeyFactsPayload(application, reference)

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        `${reference} key facts matching error: biosecurity map keys differ (keyFacts: "${keyFactsBiosecurityMapPath}", existing: "undefined")`
      )
    })

    it('should log warning when legacy has biosecurity map but keyFacts does not', () => {
      const legacyBiosecurityMapPath = 'biosecurity-map/legacy-path.pdf'
      const destination = createDestination()
      const biosecurityMapSection = createBiosecurityMapSection(
        legacyBiosecurityMapPath
      )
      const keyFacts = createKeyFacts([])
      const application = createApplication(
        [offFarmOrigin, licence, destination, biosecurityMapSection],
        keyFacts
      )

      validateKeyFactsPayload(application, reference)

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        `${reference} key facts matching error: biosecurity map keys differ (keyFacts: "undefined", existing: "${legacyBiosecurityMapPath}")`
      )
    })
  })
})
