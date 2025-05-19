import { compressPdf } from './pdf-compression.js'
import { convertBytesToMB } from './size.js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../../../config.js'
import { NotImplementedError } from '../not-implemented-error.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */

/**
 * Handles the uploaded file by processing it based on its content type.
 * Compresses the file if it is a PDF or an image, logs the compression details,
 * and returns the processed file.
 * @param {object} request
 * @param {FileAnswer} uploadedFile
 * @returns {Promise<{file: Buffer, extension: 'pdf' | 'jpg', fileSizeInMB: number}>}
 */
export const handleUploadedFile = async (request, uploadedFile) => {
  const obj = await request.s3.send(
    new GetObjectCommand({
      Bucket: config.get('aws').bucket ?? '',
      Key: uploadedFile.value.path
    })
  )

  const chunks = []
  for await (const chunk of obj.Body) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  if (obj.ContentType !== 'application/pdf') {
    throw new NotImplementedError()
  }

  const { file, duration, reduction } = await compressPdf(buffer)
  const fileSizeInMB = convertBytesToMB(file.length)

  request.logger.info(
    `File compression took ${duration}ms at a reduction of ${reduction}% to ${fileSizeInMB} MB`
  )

  return {
    file,
    extension: 'pdf',
    fileSizeInMB
  }
}
