/**
 * @param {number} sizeInBytes
 * @returns {number}
 */
export const convertBytesToMB = (sizeInBytes) => sizeInBytes / (1024 * 1024)

/**
 * @param {number} sizeInMegaBytes - The file size in megabytes.
 * @returns {number} The file size in bytes.
 */
export const convertMBToBytes = (sizeInMegaBytes) =>
  sizeInMegaBytes * 1024 * 1024

/**
 * @param {number} originalSize - The initial size of the item.
 * @param {number} finalSize - The size of the item after reduction.
 * @returns {number} The reduction in size (percentage).
 */
export const fileSizeReductionPercentage = (originalSize, finalSize) =>
  100 - (finalSize * 100) / originalSize
