import { compressPdf } from './pdf-compression.js'
import { compress } from 'compress-pdf'
import { config } from '../../../config.js'

jest.mock('compress-pdf', () => ({
  compress: jest.fn()
}))

const smallBuffer = Buffer.alloc(1 * 1024 * 1024) // 1MB buffer
const mediumBuffer = Buffer.alloc(3 * 1024 * 1024) // 3MB buffer
const largeBuffer = Buffer.alloc(10 * 1024 * 1024) // 10MB buffer

const pdfContentType = 'application/pdf'

describe('PDF Compression', () => {
  it('should compress a PDF file if its size is greater or equal to 2MB and smaller than 10MB', async () => {
    const compressedBuffer = Buffer.from('%PDF-1.4\n...compressed')
    // @ts-expect-error jest is unable to recognise the mock on an entire module
    compress.mockResolvedValue(compressedBuffer)
    config.get = jest.fn().mockReturnValue('/path/to/gs')

    const result = await compressPdf(mediumBuffer)

    expect(compress).toHaveBeenCalledWith(mediumBuffer, {
      gsModule: '/path/to/gs',
      compatibilityLevel: 1.4
    })
    expect(result.file).toBe(compressedBuffer)
    expect(result.reduction).toBe(
      100 - (compressedBuffer.length * 100) / mediumBuffer.length
    )
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.reduction).toBeGreaterThan(0)
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.contentType).toBe(pdfContentType)
  })

  it('should not compress a PDF file if its size is less than or equal to 2MB', async () => {
    const result = await compressPdf(smallBuffer)

    expect(compress).not.toHaveBeenCalled()
    expect(result.file).toBe(smallBuffer)
    expect(result.reduction).toBe(0)
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.contentType).toBe(pdfContentType)
  })

  it('should not compress a PDF file if its size is greater than or equal to 10MB', async () => {
    const result = await compressPdf(largeBuffer)

    expect(compress).not.toHaveBeenCalled()
    expect(result.file).toBe(largeBuffer)
    expect(result.reduction).toBe(0)
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.contentType).toBe(pdfContentType)
  })
})
