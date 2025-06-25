import { compressPdf } from './pdf-compression.js'
import { compressImage } from './image-compression.js'
import { convertBytesToMB } from './size.js'
import { retrieveFile } from '../../../common/connectors/storage/s3.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 * @import {Readable} from 'stream'
 */

/**
 * @typedef {{file: Buffer<ArrayBufferLike>, contentType: string, fileSizeInMB: number}} FileData
 */

/**
 * @param {FileAnswer} fileAnswer
 * @returns {Promise<FileData>}
 */
export const fetchFile = async (fileAnswer) => {
  const obj = await retrieveFile(fileAnswer.value.path ?? '')

  const chunks = []
  for await (const chunk of /** @type {Readable} */ (obj.Body)) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  return {
    file: buffer,
    contentType: obj.ContentType ?? '',
    fileSizeInMB: convertBytesToMB(buffer.length)
  }
}

/**
 * @param {FileData} fileData
 * @param {object} request
 * @returns {Promise<FileData>}
 */
export const compressFile = async (fileData, request) => {
  const { file, duration, reduction, contentType } =
    fileData.contentType === 'application/pdf'
      ? await compressPdf(fileData.file)
      : await compressImage(fileData.file)

  const fileSizeInMB = convertBytesToMB(file.length)

  request.logger.info(
    `File compression took ${duration}ms at a reduction of ${reduction}% to ${fileSizeInMB} MB`
  )

  return {
    file,
    contentType,
    fileSizeInMB
  }
}

/**
 * @param {string} contentType
 * @returns {string}
 */
export const getFileExtension = (contentType) => {
  const contentTypeMap = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }

  return contentTypeMap[contentType] || ''
}
