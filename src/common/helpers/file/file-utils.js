import { compressPdf } from './pdf-compression.js'
import { convertBytesToMB } from './size.js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../../../config.js'
import { NotImplementedError } from '../not-implemented-error.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */

/**
 * @typedef {{file: Buffer<ArrayBufferLike>, contentType: string, fileSizeInMB: number}} FileData
 */

/**
 * @param {FileAnswer} fileAnswer
 * @param {object} request
 * @returns {Promise<FileData>}
 */
export const fetchFile = async (fileAnswer, request) => {
  const obj = await request.s3.send(
    new GetObjectCommand({
      Bucket: config.get('aws').bucket ?? '',
      Key: fileAnswer.value.path
    })
  )

  const chunks = []
  for await (const chunk of obj.Body) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  return {
    file: buffer,
    contentType: obj.ContentType,
    fileSizeInMB: convertBytesToMB(buffer.length)
  }
}

/**
 * @param {FileData} fileData
 * @param {object} request
 * @returns {Promise<FileData>}
 */
export const compressFile = async (fileData, request) => {
  if (fileData.contentType !== 'application/pdf') {
    throw new NotImplementedError()
  }

  const { file, duration, reduction } = await compressPdf(fileData.file)
  const fileSizeInMB = convertBytesToMB(file.length)

  request.logger.info(
    `File compression took ${duration}ms at a reduction of ${reduction}% to ${fileSizeInMB} MB`
  )

  return {
    file,
    contentType: fileData.contentType,
    fileSizeInMB
  }
}
