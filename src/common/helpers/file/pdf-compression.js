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
 *   - {number} duration: The duration (in milliseconds) of the compression process.
 *   - {number} reduction: The percentage reduction in file size after compression.
 *   - {string} contentType: The content type of the file, which is always 'application/pdf'.
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
    duration: end - start,
    reduction: fileSizeReductionPercentage(originalSize, finalBuffer.length),
    contentType: 'application/pdf'
  }
}
