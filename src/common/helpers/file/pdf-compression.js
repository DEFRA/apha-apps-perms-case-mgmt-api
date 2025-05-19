import { compress } from 'compress-pdf'
import { config } from '../../../config.js'
import {
  convertBytesToMB,
  fileSizeReductionPercentage
} from '../../../common/helpers/file/size.js'

/**
 * Compresses a PDF file buffer if its size is within a specified range.
 * @async
 * @function compressPdf
 * @param {Buffer} buffer - The buffer of the PDF file to be compressed.
 * @returns {Promise<object>} An object containing the following properties:
 *   - {Buffer} file: The resulting buffer after compression (or the original buffer if no compression was applied).
 *   - {number} start: The timestamp (in milliseconds) when the compression process started.
 *   - {number} end: The timestamp (in milliseconds) when the compression process ended.
 *   - {number} duration: The duration (in milliseconds) of the compression process.
 *   - {number} originalSize: The size (in bytes) of the original buffer.
 *   - {number} reduction: The percentage reduction in file size after compression.
 *   - {number} size: The size (in bytes) of the resulting buffer.
 */
export const compressPdf = async (buffer) => {
  const originalSize = buffer.length
  const originalSizeInMB = convertBytesToMB(originalSize)
  const start = Date.now()
  const finalBuffer =
    originalSizeInMB > 2 && originalSizeInMB < 10
      ? await compress(buffer, {
          gsModule: config.get('gsPath'),
          compatibilityLevel: 1.4
        })
      : buffer // no need to compress if the file is already small or too big
  const end = Date.now()

  return {
    file: finalBuffer,
    start,
    end,
    duration: end - start,
    originalSize,
    reduction: fileSizeReductionPercentage(originalSize, finalBuffer.length),
    size: finalBuffer.length
  }
}
