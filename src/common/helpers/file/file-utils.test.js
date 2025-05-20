import { fetchFile, compressFile } from './file-utils.js'
import { compressPdf } from './pdf-compression.js'
import { config } from '../../../config.js'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { NotImplementedError } from '../not-implemented-error.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */

const mockFileSize = 1.5
const pdfContentType = 'application/pdf'

jest.mock('./pdf-compression.js')
jest.mock('./size.js')
jest.mock('@aws-sdk/client-s3')
jest.mock('../../../config.js')

const pdfStream = createReadStream(
  path.resolve('./src/common/helpers/file/example.pdf')
)

const mockS3ObjectPdf = {
  Body: pdfStream,
  ContentType: pdfContentType
}

const compressedPdfBuffer = Buffer.from('compressed-pdf')
const pdfBuffer = Buffer.from('mock-pdf')

jest.mock('./pdf-compression.js', () => ({
  compressPdf: jest.fn().mockResolvedValue({
    file: Buffer.from('compressed-pdf'),
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
      s3: {
        send: jest.fn()
      },
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
      mockReq.s3.send.mockResolvedValue(mockS3ObjectPdf)

      const result = await fetchFile(mockUploadedFile, mockReq)

      expect(mockReq.s3.send).toHaveBeenCalled()
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

    it('should NOT handle image files', async () => {
      const fileData = {
        file: pdfBuffer,
        contentType: 'other',
        fileSizeInMB: mockFileSize
      }
      await expect(compressFile(fileData, mockReq)).rejects.toThrow(
        NotImplementedError
      )
    })
  })
})
