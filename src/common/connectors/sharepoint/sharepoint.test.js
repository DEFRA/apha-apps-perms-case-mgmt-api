import { spyOnConfig } from '../../test-helpers/config.js'
import { addItem, uploadFile, getListItemUrl } from './sharepoint.js'

const graphMocks = {}
const tenantId = 'tenant'
const clientId = 'client'
const clientSecret = 'secret'
const driveId = 'driveId'
const folderPath = 'folderPath'
const listId = 'listId'
const siteId = 'siteId'

jest.mock('@microsoft/microsoft-graph-client', () => {
  const putMock = jest.fn().mockResolvedValue({ success: true })
  const postMock = jest.fn().mockResolvedValue({ success: true })
  const apiMock = jest.fn(() => ({ put: putMock, post: postMock }))
  const initWithMiddlewareMock = jest.fn(() => ({
    api: apiMock
  }))

  // expose the mocks
  graphMocks.putMock = putMock
  graphMocks.postMock = postMock
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

describe('addItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    spyOnConfig('sharepoint', {
      tenantId,
      clientId,
      clientSecret,
      driveId,
      folderPath,
      listId,
      siteId
    })
  })

  const fields = {
    Title: 'Foo'
  }

  it('should call the items endpoint of the configured list with the provided fields', async () => {
    const result = await addItem(fields)

    expect(graphMocks.apiMock).toHaveBeenCalledWith(
      `/sites/${siteId}/lists/${listId}/items`
    )

    expect(graphMocks.postMock).toHaveBeenCalledWith({
      fields
    })
    expect(result).toEqual({ success: true })
  })

  it('should propagate errors from graphClient.post', async () => {
    const error = new Error('Upload failed')
    graphMocks.postMock.mockRejectedValue(error)

    await expect(addItem(fields)).rejects.toThrow('Upload failed')
  })
})

describe('getListItemUrl', () => {
  it('should build the correct SharePoint list item URL', () => {
    const webUrl =
      'https://example.sharepoint.com/sites/site/Lists/MyList/AllItems.aspx'
    const itemId = '123'
    const expected =
      'https://example.sharepoint.com/sites/site/Lists/MyList/DispForm.aspx?ID=123'
    expect(getListItemUrl(webUrl, itemId)).toBe(expected)
  })

  it('should handle URLs with query parameters', () => {
    const webUrl =
      'https://example.sharepoint.com/sites/site/Lists/MyList/AllItems.aspx?viewid=789'
    const itemId = '789'
    const expected =
      'https://example.sharepoint.com/sites/site/Lists/MyList/DispForm.aspx?ID=789'
    expect(getListItemUrl(webUrl, itemId)).toBe(expected)
  })

  it('should handle URLs with multiple path segments', () => {
    const webUrl =
      'https://example.sharepoint.com/sites/site/subsite/Lists/MyList/AllItems.aspx'
    const itemId = '999'
    const expected =
      'https://example.sharepoint.com/sites/site/subsite/Lists/MyList/DispForm.aspx?ID=999'
    expect(getListItemUrl(webUrl, itemId)).toBe(expected)
  })
})
