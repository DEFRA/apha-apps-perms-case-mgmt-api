import { handleUploadedFile } from './file-utils.js'
import { compressPdf } from './pdf-compression.js'
import { config } from '../../../config.js'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { NotImplementedError } from '../not-implemented-error.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */

jest.mock('./pdf-compression.js')
jest.mock('./size.js')
jest.mock('@aws-sdk/client-s3')
jest.mock('../../../config.js')

const mockS3ImageObject = {
  Body: createReadStream(
    path.resolve('./src/common/helpers/file/example-portrait.jpg')
  )
}

const pdfStream = createReadStream(
  path.resolve('./src/common/helpers/file/example.pdf')
)

const mockS3ObjectPdf = {
  Body: pdfStream,
  ContentType: 'application/pdf'
}

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

describe('handleUploadedFile', () => {
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

  it('should handle PDF files and log compression details', async () => {
    mockReq.s3.send.mockResolvedValue(mockS3ObjectPdf)

    const result = await handleUploadedFile(mockReq, mockUploadedFile)

    expect(mockReq.s3.send).toHaveBeenCalled()
    expect(compressPdf).toHaveBeenCalled()
    expect(mockReq.logger.info).toHaveBeenCalledWith(
      'File compression took 100ms at a reduction of 50% to 1.5 MB'
    )
    expect(result.file).toEqual(Buffer.from('compressed-pdf'))
  })

  it('should NOT handle image files and log compression details', async () => {
    mockReq.s3.send.mockResolvedValue(mockS3ImageObject)
    await expect(handleUploadedFile(mockReq, mockUploadedFile)).rejects.toThrow(
      NotImplementedError
    )
  })
})
