import {
  getAvailableVersions,
  getLatestVersions,
  getLatestVersionForPlatform,
  resolveVersion,
  getLowerVersion
} from '../src/versions_vulkan'
import * as core from '@actions/core'
import * as http from '../src/http'
import * as platform from '../src/platform'
import * as versions from '../src/versions'

jest.mock('../src/http')
jest.mock('../src/platform')
jest.mock('../src/versions')

describe('versions_vulkan', () => {
  describe('getAvailableVersions', () => {
    it('should return available versions for the current platform', async () => {
      const mockPlatform = 'linux'
      const mockVersions = ['1.4.304.0', '1.3.296.0']
      ;(platform.getPlatform as jest.Mock).mockReturnValue(mockPlatform)
      ;(http.client.getJson as jest.Mock).mockResolvedValue({ result: mockVersions })

      const result = await getAvailableVersions()
      expect(result).toEqual({ versions: mockVersions })
    })

    it('should throw an error if unable to retrieve versions', async () => {
      const mockPlatform = 'linux'
      ;(jest.spyOn(platform, 'getPlatform') as jest.Mock).mockResolvedValue(mockPlatform)
      ;(http.client.getJson as jest.Mock).mockResolvedValue({ result: null })

      await expect(getAvailableVersions()).rejects.toThrow(
        'Unable to retrieve the list of all available VULKAN SDK versions from'
      )
    })
  })

  describe('getLatestVersions', () => {
    it('should return the latest versions for each platform', async () => {
      const mockLatestVersions = {
        linux: '1.4.304.0',
        mac: '1.4.304.0',
        warm: '1.4.304.0',
        windows: '1.4.304.0'
      }
      ;(http.client.getJson as jest.Mock).mockResolvedValue({ result: mockLatestVersions })

      const result = await getLatestVersions()
      expect(result).toEqual(mockLatestVersions)
    })

    it('should throw an error if unable to retrieve latest versions', async () => {
      ;(http.client.getJson as jest.Mock).mockResolvedValue({ result: null })

      await expect(getLatestVersions()).rejects.toThrow('Unable to retrieve the latest version information from')
    })
  })

  describe('getLatestVersionForPlatform', () => {
    it('should return the latest version for Windows', () => {
      const mockLatestVersions = {
        linux: '1.4.304.0',
        mac: '1.4.304.0',
        warm: '1.4.304.0',
        windows: '1.4.304.0'
      }
      Object.defineProperty(platform, 'IS_WINDOWS', { get: () => true })

      const result = getLatestVersionForPlatform(mockLatestVersions)
      expect(result).toBe('1.4.304.0')
    })

    it('should return the latest version for Linux', () => {
      const mockLatestVersions = {
        linux: '1.4.304.0',
        mac: '1.4.304.0',
        warm: '1.4.304.0',
        windows: '1.4.304.0'
      }
      Object.defineProperty(platform, 'IS_LINUX', { get: () => true })

      const result = getLatestVersionForPlatform(mockLatestVersions)
      expect(result).toBe('1.4.304.0')
    })
  })

  describe('resolveVersion', () => {
    it('should resolve "latest" to the latest version for the platform', async () => {
      const mockLatestVersions = {
        linux: '1.4.304.0',
        mac: '1.4.304.0',
        warm: '1.4.304.0',
        windows: '1.4.304.0'
      }
      Object.defineProperty(platform, 'IS_LINUX', { get: () => true })
      ;(http.client.getJson as jest.Mock).mockResolvedValue({ result: mockLatestVersions })

      const result = await resolveVersion('latest')
      expect(result).toBe('1.4.304.0')
    })

    it('should return the passed version if it is not "latest"', async () => {
      const result = await resolveVersion('1.3.296.0')
      expect(result).toBe('1.3.296.0')
    })

    it('should handle errors during version resolution', async () => {
      ;(http.client.getJson as jest.Mock).mockRejectedValue(new Error('Network error'))
      jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())

      const result = await resolveVersion('latest')
      expect(result).toBe('latest')
      expect(core.setFailed).toHaveBeenCalledWith('Network error')
    })
  })

  describe('getLowerVersion', () => {
    it('should return the next lower version', async () => {
      const mockVersions = ['1.4.304.0', '1.3.296.0', '1.3.290.0']
      jest.spyOn(versions, 'compare').mockImplementation((a: string, b: string) => a.localeCompare(b))

      const result = await getLowerVersion('1.4.304.0', mockVersions)
      expect(result).toBe('1.3.296.0')
    })

    it('should return the same version if it is the lowest', async () => {
      const mockVersions = ['1.4.304.0', '1.3.296.0', '1.3.290.0']
      jest.spyOn(versions, 'compare').mockImplementation((a, b) => a.localeCompare(b))

      const result = await getLowerVersion('1.3.290.0', mockVersions)
      expect(result).toBe('1.3.290.0')
    })

    it('should throw an error if versions list is empty', async () => {
      await expect(getLowerVersion('1.4.304.0', [])).rejects.toThrow('versions list is empty')
    })
  })
})
