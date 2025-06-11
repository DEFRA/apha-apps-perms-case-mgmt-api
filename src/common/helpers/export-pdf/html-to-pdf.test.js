import { generatePdfBufferFromHtml } from './html-to-pdf.js'

/** @import {TextAnswer} from '../data-extract/data-extract.js' */

const mockPdfBuffer = Buffer.from('PDFDATA')
const mockPdf = jest.fn().mockResolvedValue(mockPdfBuffer)
const mockSetContent = jest.fn()
const mockNewPage = jest.fn().mockResolvedValue({
  setContent: mockSetContent,
  pdf: mockPdf
})
const mockClose = jest.fn()
const mockBrowser = {
  newPage: mockNewPage,
  close: mockClose
}

jest.mock('puppeteer', () => ({
  launch: () => mockBrowser
}))

describe('generatePdfBufferFromHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  it('should generate a PDF buffer from HTML', async () => {
    const reference = 'TB-1234-5678'
    const buffer = await generatePdfBufferFromHtml(sampleData, reference)

    expect(mockNewPage).toHaveBeenCalled()
    expect(mockSetContent).toHaveBeenCalledWith(
      expect.stringContaining('Section 1'),
      { waitUntil: 'networkidle0' }
    )
    expect(mockPdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })
    expect(mockClose).toHaveBeenCalled()
    expect(buffer).toBe(mockPdfBuffer)
  })

  it('should include the reference in the generated HTML', async () => {
    const reference = 'TB-1234-5678'
    await generatePdfBufferFromHtml(sampleData, reference)
    const htmlPassed = mockSetContent.mock.calls[0][0]

    expect(htmlPassed).toMatchSnapshot()
  })
})
