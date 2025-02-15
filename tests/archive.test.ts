import * as tc from '@actions/tool-cache'
import * as platform from '../src/platform'
import { extract } from '../src/archive'

jest.mock('@actions/tool-cache')
jest.mock('../src/platform', () => ({
  __esModule: true,
  IS_WINDOWS: jest.fn().mockReturnValue(false),
  IS_WINDOWS_ARM: jest.fn().mockReturnValue(false),
  IS_MAC: jest.fn().mockReturnValue(false),
  IS_LINUX: jest.fn().mockReturnValue(false),
  IS_LINUX_ARM: jest.fn().mockReturnValue(false)
}))

describe('extract function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns destination for .exe files on Windows', async () => {
    ;(platform.IS_WINDOWS as unknown as jest.Mock).mockReturnValue(true)
    const result = await extract('test.exe', '/destination')
    expect(result).toBe('/destination')
  })

  it('returns destination for .exe files on Windows', async () => {
    ;(platform.IS_WINDOWS_ARM as unknown as jest.Mock).mockReturnValue(true)
    const result = await extract('test.exe', '/destination')
    expect(result).toBe('/destination')
  })

  it('calls extractZip for .zip files on Windows', async () => {
    ;(platform.IS_WINDOWS as unknown as jest.Mock).mockReturnValue(true)
    jest.spyOn(tc, 'extractZip').mockResolvedValue('/destination')
    const result = await extract('test.zip', '/destination')
    expect(tc.extractZip).toHaveBeenCalledWith('test.zip', '/destination')
    expect(result).toBe('/destination')
  })

  it('calls extract7z for .7z files on Windows', async () => {
    ;(platform.IS_WINDOWS as unknown as jest.Mock).mockReturnValue(true)
    jest.spyOn(tc, 'extract7z').mockResolvedValue('/destination')
    const result = await extract('test.7z', '/destination')
    expect(tc.extract7z).toHaveBeenCalledWith('test.7z', '/destination')
    expect(result).toBe('/destination')
  })

  it('calls extractZip for .zip files on macOS', async () => {
    ;(platform.IS_MAC as unknown as jest.Mock).mockReturnValue(true)
    jest.spyOn(tc, 'extractZip').mockResolvedValue('/destination')
    const result = await extract('test.zip', '/destination')
    expect(tc.extractZip).toHaveBeenCalledWith('test.zip', '/destination')
    expect(result).toBe('/destination')
  })
})
