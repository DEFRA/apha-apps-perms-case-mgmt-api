import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { compressPdf } from './pdf-compression.js'
import { compressImage } from './image-compression.js'
import { convertBytesToMB } from './size.js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../../../config.js'

/**
 * @import {FileAnswer} from '../data-extract/data-extract.js'
 */
// Helpers for __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @typedef {{file: Buffer, contentType: string, fileSizeInMB: number}} FileData
 */

/**
 * @param {FileAnswer} fileAnswer
 * @param {object} request
 * @returns {Promise<FileData>}
 */
export const fetchFile = async (fileAnswer, request) => {
  const isLocal =
    config.get('cdpEnvironment') === 'local' || config.get('isDevelopment')

  if (isLocal) {
    const relativePath = fileAnswer?.value?.path
    if (!relativePath) {
      throw new Error('Missing file path in fileAnswer.value.path')
    }
    const absolutePath = path.resolve(__dirname, '../../../..', relativePath)
    const buffer = await fs.readFile(absolutePath)
    const contentType = inferContentTypeFromPath(relativePath)

    return {
      file: buffer,
      contentType,
      fileSizeInMB: convertBytesToMB(buffer.length)
    }
  }

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

const inferContentTypeFromPath = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.pdf') return 'application/pdf'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  return 'application/octet-stream'
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
    'image/jpeg': 'jpg'
  }

  return contentTypeMap[contentType] || ''
}
