import { spyOnConfig } from '../../test-helpers/config.js'
import {
  generateEmailContent,
  generateSharepointNotificationContent,
  getFileProps
} from './email-content.js'

/**
 * @import {ApplicationData} from '../data-extract/data-extract.js'
 */

const testReference = 'TB-1234-5678'
const testRetention = '7 days'

describe('generateEmailContent', () => {
  it('should generate email content with the correct structure', () => {
    /** @type {ApplicationData} */
    const payload = {
      journeyId: 'journeyId',
      sections: [
        {
          sectionKey: 'section1',
          title: 'Section 1 Title',
          questionAnswers: [
            {
              question: 'Question 1',
              questionKey: 'question1',
              answer: { type: 'text', value: 'value', displayText: 'Answer 1' }
            },
            {
              question: 'Question 2',
              questionKey: 'question2',
              answer: { type: 'text', value: 'value', displayText: 'Answer 2' }
            }
          ]
        },
        {
          sectionKey: 'section2',
          title: 'Section 2 Title',
          questionAnswers: [
            {
              question: 'Question 3',
              questionKey: 'question3',
              answer: { type: 'text', value: 'value', displayText: 'Answer 3' }
            }
          ]
        }
      ]
    }

    const result = generateEmailContent(payload, testReference)

    const expectedContent = [
      '# Application reference',
      testReference,
      '',
      '---',
      '# Section 1 Title',
      '',
      '---',
      '## Question 1',
      'Answer 1',
      '## Question 2',
      'Answer 2',
      '# Section 2 Title',
      '',
      '---',
      '## Question 3',
      'Answer 3'
    ].join('\n')

    expect(result).toBe(expectedContent)
  })

  it('should handle empty sections gracefully', () => {
    const payload = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: []
    }

    const result = generateEmailContent(payload, testReference)

    const expectedContent = [
      '# Application reference',
      testReference,
      '',
      '---'
    ].join('\n')

    expect(result).toBe(expectedContent)
  })

  it('should handle sections with no questionAnswers gracefully', () => {
    const payload = {
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      sections: [
        {
          sectionKey: 'section1',
          title: 'Section 1 Title',
          questionAnswers: []
        }
      ]
    }

    const result = generateEmailContent(payload, testReference)

    const expectedContent = [
      '# Application reference',
      testReference,
      '',
      '---',
      '# Section 1 Title',
      '',
      '---'
    ].join('\n')

    expect(result).toBe(expectedContent)
  })

  describe('should handle file answers correctly', () => {
    it('should include displayText when skipped is true', () => {
      /** @type {ApplicationData} */
      const payload = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [
          {
            sectionKey: 'section1',
            title: 'Section 1 Title',
            questionAnswers: [
              {
                question: 'Upload a file',
                questionKey: 'file1',
                answer: {
                  type: 'file',
                  value: { skipped: true },
                  displayText: 'No file uploaded'
                }
              }
            ]
          }
        ]
      }

      const result = generateEmailContent(payload, testReference)

      const expectedContent = [
        '# Application reference',
        testReference,
        '',
        '---',
        '# Section 1 Title',
        '',
        '---',
        '## Upload a file',
        'No file uploaded'
      ].join('\n')

      expect(result).toBe(expectedContent)
    })

    it('should ignore displayText when skipped is false', () => {
      /** @type {ApplicationData} */
      const payload = {
        journeyId:
          'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
        sections: [
          {
            sectionKey: 'section1',
            title: 'Section 1 Title',
            questionAnswers: [
              {
                question: 'Upload a file',
                questionKey: 'file1',
                answer: {
                  type: 'file',
                  value: { skipped: false },
                  displayText: 'No file uploaded'
                }
              }
            ]
          }
        ]
      }

      const result = generateEmailContent(payload, testReference)

      const expectedContent = [
        '# Application reference',
        testReference,
        '',
        '---',
        '# Section 1 Title',
        '',
        '---',
        '## Upload a file'
      ].join('\n')

      expect(result).toBe(expectedContent)
    })
  })
})

describe('getFileProps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return correct file props with base64 file, filename, confirmation and retention for pdf content type', async () => {
    spyOnConfig('notify', {
      fileRetention: testRetention,
      confirmDownloadConfirmation: true
    })

    const fakeBuffer = Buffer.from('test content')
    const fileData = {
      file: fakeBuffer,
      contentType: 'application/pdf',
      fileSizeInMB: 1
    }

    const result = getFileProps(fileData)

    expect(result).toEqual({
      file: fakeBuffer.toString('base64'),
      filename: 'Biosecurity-map.pdf',
      confirm_email_before_download: true,
      retention_period: testRetention
    })
  })

  it('should return correct file props with base64 file, filename, confirmation and retention for image/jpeg content type', async () => {
    spyOnConfig('notify', {
      fileRetention: testRetention,
      confirmDownloadConfirmation: true
    })

    const fakeBuffer = Buffer.from('abc')
    const fileData = {
      file: fakeBuffer,
      contentType: 'image/jpeg',
      fileSizeInMB: 1
    }

    const result = getFileProps(fileData)

    expect(result).toEqual({
      file: fakeBuffer.toString('base64'),
      filename: 'Biosecurity-map.jpg',
      confirm_email_before_download: true,
      retention_period: testRetention
    })
  })
})

jest.mock('../data-extract/data-extract.js', () => ({
  createApplication: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue({
        answer: {
          displayText: 'Name Surname'
        }
      })
    })
  }),
  getTbLicenceType: jest.fn().mockReturnValue('TB Test Licence'),
  getRequesterCphNumber: jest.fn(() => '12/3456/7890')
}))

describe('generateSharepointNotificationContent', () => {
  afterAll(jest.restoreAllMocks)

  it('should generate content with licence type, CPH, name, reference and link', () => {
    const applicationData = /** @type {ApplicationData} */ ({
      sections: [
        {
          title: 'Receiving the licence',
          sectionKey: 'licence',
          questionAnswers: [
            {
              question: 'fullName',
              questionKey: 'fullName',
              answer: {
                type: 'name',
                value: { firstName: 'Name', lastName: 'Surname' },
                displayText: 'Name Surname'
              }
            }
          ]
        }
      ]
    })
    const link = 'https://example.com/tb25'

    const result = generateSharepointNotificationContent(
      applicationData,
      testReference,
      link
    )

    const expectedContent = [
      'A Bovine TB licence application has been received with the following details:',
      '## Licence type:',
      'TB Test Licence',
      '## CPH of requester:',
      '12/3456/7890',
      '## Name of requester:',
      'Name Surname',
      '## Application reference number:',
      testReference,
      '',
      '---',
      `Full details can be found on TB25 with the following link: ${link}`
    ].join('\n')

    expect(result).toBe(expectedContent)
  })
})
