import { fetchFile, compressFile, getFileExtension } from './file-utils.js'
import { compressPdf } from './pdf-compression.js'
import { compressImage } from './image-compression.js'
import { config } from '../../../config.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */

const mockFileSize = 1.5
const pdfContentType = 'application/pdf'
const jpegContentType = 'image/jpeg'
const pngContentType = 'image/png'

jest.mock('./pdf-compression.js')
jest.mock('./image-compression.js')
jest.mock('./size.js')
jest.mock('@aws-sdk/client-s3')
jest.mock('../../../config.js')
jest.mock('../../connectors/storage/s3.js', () => {
  const { createReadStream } = require('node:fs')
  const path = require('node:path')
  return {
    retrieveFile: jest.fn().mockReturnValue({
      Body: createReadStream(
        path.resolve('./src/common/helpers/file/example.pdf')
      ),
      ContentType: 'application/pdf'
    })
  }
})

const compressedPdfBuffer = Buffer.from('compressed-pdf')
const compressedImageBuffer = Buffer.from('compressed-image')
const pdfBuffer = Buffer.from('mock-pdf')
const imageBuffer = Buffer.from('mock-image')

jest.mock('./pdf-compression.js', () => ({
  compressPdf: jest.fn().mockResolvedValue({
    file: Buffer.from('compressed-pdf'),
    duration: 100,
    reduction: 50
  })
}))

jest.mock('./image-compression.js', () => ({
  compressImage: jest.fn().mockResolvedValue({
    file: Buffer.from('compressed-image'),
    duration: 100,
    reduction: 50
  })
}))

jest.mock('./size.js', () => ({
  convertBytesToMB: jest.fn().mockReturnValue(1.5)
}))

/** @type {FileAnswer} */
const mockUploadedFile = {
  type: 'file',
  value: {
    skipped: false,
    path: 'mock-s3-key'
  },
  displayText: 'display text'
}

describe('File Utils', () => {
  let mockReq

  beforeEach(() => {
    mockReq = {
      logger: {
        info: jest.fn()
      }
    }

    config.get = jest.fn().mockReturnValue({
      bucket: 'test-bucket'
    })
  })

  describe('fetchFile', () => {
    it('should fetch the files and return content type and size in MB', async () => {
      const result = await fetchFile(mockUploadedFile)

      expect(result.contentType).toEqual(pdfContentType)
      expect(result.fileSizeInMB).toEqual(mockFileSize)
    })
  })

  describe('compressFile', () => {
    it('should handle PDF files and log compression details', async () => {
      const fileData = {
        file: pdfBuffer,
        contentType: pdfContentType,
        fileSizeInMB: mockFileSize
      }

      const result = await compressFile(fileData, mockReq)

      expect(compressPdf).toHaveBeenCalled()
      expect(mockReq.logger.info).toHaveBeenCalledWith(
        'File compression took 100ms at a reduction of 50% to 1.5 MB'
      )
      expect(result.file).toEqual(compressedPdfBuffer)
    })

    it('should handle jpeg image files and log compression details', async () => {
      const fileData = {
        file: imageBuffer,
        contentType: jpegContentType,
        fileSizeInMB: mockFileSize
      }

      const result = await compressFile(fileData, mockReq)

      expect(compressImage).toHaveBeenCalled()
      expect(mockReq.logger.info).toHaveBeenCalledWith(
        'File compression took 100ms at a reduction of 50% to 1.5 MB'
      )
      expect(result.file).toEqual(compressedImageBuffer)
    })

    it('should handle png image files and log compression details', async () => {
      const fileData = {
        file: imageBuffer,
        contentType: pngContentType,
        fileSizeInMB: mockFileSize
      }

      const result = await compressFile(fileData, mockReq)

      expect(compressImage).toHaveBeenCalled()
      expect(mockReq.logger.info).toHaveBeenCalledWith(
        'File compression took 100ms at a reduction of 50% to 1.5 MB'
      )
      expect(result.file).toEqual(compressedImageBuffer)
    })
  })

  describe('getFileExtension', () => {
    it('should return "pdf" for application/pdf', () => {
      expect(getFileExtension('application/pdf')).toBe('pdf')
    })

    it('should return "jpg" for image/jpeg', () => {
      expect(getFileExtension('image/jpeg')).toBe('jpg')
    })

    it('should return empty string for unknown content type', () => {
      expect(getFileExtension('application/zip')).toBe('')
      expect(getFileExtension('text/plain')).toBe('')
      expect(getFileExtension('')).toBe('')
    })
  })
})
