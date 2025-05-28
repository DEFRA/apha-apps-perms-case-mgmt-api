import { compressImage, compressToTargetSize } from './image-compression.js'
import { readFile } from 'fs/promises'
import sharp from 'sharp'
import path from 'path'

jest.mock('sharp', () => {
  const sharp = jest.fn(() => ({
    metadata: jest.fn(),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn()
  }))
  return sharp
})

const imageContentType = 'image/jpeg'

describe('imageCompression', () => {
  let buffer

  beforeEach(async () => {
    buffer = await readFile(
      path.resolve('./src/common/helpers/file/example-portrait.jpg')
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should compress the image and return the file', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }
    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    const result = await compressImage(buffer)

    expect(result).toHaveProperty('file')
    expect(result.file).toBeInstanceOf(Buffer)
    expect(result).toHaveProperty('duration')
    expect(result).toHaveProperty('reduction')
    expect(result.contentType).toBe(imageContentType)
  })

  it('should resize the image if width is greater than height', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.resize).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      fit: 'inside'
    })
  })

  it('should resize the image if height is greater than width', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 2000, height: 3000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.resize).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      fit: 'inside'
    })
  })

  it('should not resize the image if longest edge is already as desired length', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 1080, height: 1920 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.resize).toHaveBeenCalledTimes(1)
  })

  it('should perform binary search compression if resized buffer is too large', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest
        .fn()
        .mockResolvedValueOnce(Buffer.alloc(3 * 1024 * 1024))
        .mockResolvedValueOnce(Buffer.alloc(2 * 1024 * 1024))
        .mockResolvedValueOnce(Buffer.alloc(1.8 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
      quality: expect.any(Number)
    })
    expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(2)
  })

  it('should not perform binary search compression if resized buffer is within threshold', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ progressive: true })
    expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(1)
  })

  it('should handle case where width is equal to height and greater than 1920', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 3000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.resize).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      fit: 'inside'
    })
  })

  it('should handle case where width is equal to height and less than 1920', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 1000, height: 1000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.resize).toHaveBeenCalledTimes(1)
  })

  it('should handle case where buffer size is within threshold and no compression is needed', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.9 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ progressive: true })
    expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(1)
  })

  it('should handle case where buffer size is exactly at the upper threshold', async () => {
    const mockSharpInstance = {
      metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000 }),
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(2 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    await compressImage(buffer)

    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ progressive: true })
    expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(1)
  })

  it('should handle case where buffer size is greater than upper threshold and binary search finds exact match', async () => {
    const mockSharpInstance = {
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest
        .fn()
        .mockResolvedValueOnce(Buffer.alloc(3 * 1024 * 1024))
        .mockResolvedValueOnce(Buffer.alloc(2 * 1024 * 1024))
        .mockResolvedValueOnce(Buffer.alloc(1.95 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    const targetFileSize = 2 * 1024 * 1024 // 2 MB
    const lowerThreshold = targetFileSize * 0.95
    const upperThreshold = targetFileSize

    const { resizedBuffer } = await compressToTargetSize(
      buffer,
      targetFileSize,
      lowerThreshold,
      upperThreshold
    )

    expect(resizedBuffer.length).toBeLessThanOrEqual(targetFileSize)
    expect(resizedBuffer.length).toBeGreaterThanOrEqual(lowerThreshold)
  })

  it('should handle case where buffer size is less than or equal to upper threshold', async () => {
    const mockSharpInstance = {
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(1.5 * 1024 * 1024))
    }

    // @ts-expect-error jest is unable to recognise the mock on an entire module
    sharp.mockImplementation(() => mockSharpInstance)

    const targetFileSize = 2 * 1024 * 1024 // 2 MB
    const lowerThreshold = targetFileSize * 0.95
    const upperThreshold = targetFileSize

    const { resizedBuffer } = await compressToTargetSize(
      buffer,
      targetFileSize,
      lowerThreshold,
      upperThreshold
    )

    expect(resizedBuffer.length).toBeLessThanOrEqual(targetFileSize)
  })
})
