import { spyOnConfig } from '../../test-helpers/config.js'
import { uploadFile } from './sharepoint.js'

const graphMocks = {}
const tenantId = 'tenant'
const clientId = 'client'
const clientSecret = 'secret'
const driveId = 'driveId'
const folderPath = 'folderPath'

jest.mock('@microsoft/microsoft-graph-client', () => {
  const putMock = jest.fn().mockResolvedValue({ success: true })
  const apiMock = jest.fn(() => ({ put: putMock }))
  const initWithMiddlewareMock = jest.fn(() => ({
    api: apiMock
  }))

  // expose the mocks
  graphMocks.putMock = putMock
  graphMocks.apiMock = apiMock
  graphMocks.initWithMiddlewareMock = initWithMiddlewareMock

  return {
    Client: {
      initWithMiddleware: initWithMiddlewareMock
    }
  }
})

describe('uploadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    spyOnConfig('sharepoint', {
      tenantId,
      clientId,
      clientSecret,
      driveId,
      folderPath
    })
  })

  it('calls graphClient with correct path and file', async () => {
    const reference = 'TB-XXXX-XXXX'
    const fileName = 'uplooaded-file.pdf'
    const file = new Uint8Array([1, 2, 3])

    const result = await uploadFile(reference, fileName, file)

    expect(graphMocks.apiMock).toHaveBeenCalledWith(
      `/drives/${driveId}/items/root:/${folderPath}/${reference}/${fileName}:/content`
    )

    expect(graphMocks.putMock).toHaveBeenCalledWith(file)
    expect(result).toEqual({ success: true })
  })

  it('should propagate errors from graphClient.put', async () => {
    const error = new Error('Upload failed')
    graphMocks.putMock.mockRejectedValue(error)

    await expect(
      uploadFile('ref', 'file.txt', new Uint8Array())
    ).rejects.toThrow('Upload failed')
  })
})
