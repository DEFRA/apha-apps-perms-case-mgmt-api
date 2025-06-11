import { generateHtmlBuffer } from './export-html.js'

/** @import {TextAnswer} from '../data-extract/data-extract.js' */

describe('generateHtmlBuffer', () => {
  /** @type {TextAnswer} */
  const answer1 = {
    type: 'text',
    value: 'A1',
    displayText: 'A1'
  }
  /** @type {TextAnswer} */
  const answer2 = {
    type: 'text',
    value: 'A2',
    displayText: 'A2'
  }
  /** @type {TextAnswer} */
  const answer3 = {
    type: 'text',
    value: 'A3',
    displayText: 'A3'
  }

  const sampleData = {
    sections: [
      {
        title: 'Section 1',
        sectionKey: 'section1',
        questionAnswers: [
          {
            question: 'Q1',
            questionKey: 'q1',
            answer: answer1
          },
          {
            question: 'Q2',
            questionKey: 'q2',
            answer: answer2
          }
        ]
      },
      {
        title: 'Section 2',
        sectionKey: 'section2',
        questionAnswers: [
          {
            question: 'Q3',
            questionKey: 'q3',
            answer: answer3
          }
        ]
      }
    ]
  }

  it('should include the reference in the generated HTML', async () => {
    const reference = 'TB-1234-5678'
    const bufferFromSpy = jest.spyOn(Buffer, 'from')

    await generateHtmlBuffer(sampleData, reference)
    const htmlPassed = bufferFromSpy.mock.calls[0][0]

    expect(htmlPassed).toMatchSnapshot()

    bufferFromSpy.mockRestore()
  })
})
