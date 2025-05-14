import { generateEmailContent } from './email-content.js'

const testReference = 'TB12345678'

describe('generateEmailContent', () => {
  it('should generate email content with the correct structure', () => {
    const payload = {
      sections: {
        section1: {
          title: 'Section 1 Title',
          questionAnswers: [
            { question: 'Question 1', answer: { displayText: 'Answer 1' } },
            { question: 'Question 2', answer: { displayText: 'Answer 2' } }
          ]
        },
        section2: {
          title: 'Section 2 Title',
          questionAnswers: [
            { question: 'Question 3', answer: { displayText: 'Answer 3' } }
          ]
        }
      }
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
      sections: {}
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
      sections: {
        section1: {
          title: 'Section 1 Title',
          questionAnswers: []
        }
      }
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
