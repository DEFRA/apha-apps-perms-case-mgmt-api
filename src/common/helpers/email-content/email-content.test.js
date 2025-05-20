import { spyOnConfig } from '../../test-helpers/config.js'
import { generateEmailContent, getFileProps } from './email-content.js'

const testReference = 'TB12345678'

describe('generateEmailContent', () => {
  it('should generate email content with the correct structure', () => {
    /** @type {import('../data-extract/data-extract.js').ApplicationData} */
    const payload = {
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
})

describe('getFileProps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return correct file props with base64 file, filename, confirmation and retention', async () => {
    spyOnConfig('notify', {
      fileRetention: '7 days',
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
      retention_period: '7 days'
    })
  })

  it('should use the provided extension in the filename', async () => {
    spyOnConfig('notify', {
      fileRetention: '14 days',
      confirmDownloadConfirmation: true
    })

    const fakeBuffer = Buffer.from('abc')
    const fileData = {
      file: fakeBuffer,
      contentType: 'other',
      fileSizeInMB: 1
    }
    const result = getFileProps(fileData)

    expect(result.filename).toBe('Biosecurity-map.jpg')
  })
})
