import {
  getUrlVulkanSdk,
  getUrlVulkanRuntime,
  downloadVulkanSdk,
  downloadVulkanRuntime,
  getVulkanSdkFilename
} from '../src/downloader'
import * as platform from '../src/platform'
//import * as versions from '../src/versions'
import * as versionsVulkan from '../src/versions_vulkan'
import * as http from '../src/http'
import * as tc from '@actions/tool-cache'
//import * as core from '@actions/core'
//import * as path from 'node:path'

jest.mock('../src/platform')
jest.mock('../src/versions')
jest.mock('../src/versions_vulkan')
jest.mock('../src/http', () => ({
  isDownloadable: jest.fn() as jest.Mock
}))
jest.mock('@actions/tool-cache')
jest.mock('@actions/core')

describe('downloader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(platform, 'getPlatform').mockReturnValue('')
    Object.defineProperty(platform, 'IS_WINDOWS', { value: false, configurable: true })
    Object.defineProperty(platform, 'IS_LINUX', { value: false, configurable: true })
    Object.defineProperty(platform, 'IS_MAC', { value: false, configurable: true })
  })

  describe('getUrlVulkanSdk', () => {
    it('should return the correct URL for Windows', async () => {
      ;(platform.getPlatform as jest.Mock).mockReturnValue('windows')
      Object.defineProperty(platform, 'IS_WINDOWS', { value: true, configurable: true })
      const version = '1.3.216.0'
      const expectedUrl = `https://sdk.lunarg.com/sdk/download/${version}/windows/VulkanSDK-${version}-Installer.exe`
      ;(http.isDownloadable as jest.Mock).mockResolvedValue(true)

      const url = await getUrlVulkanSdk(version)
      expect(url).toBe(expectedUrl)
    })

    it('should return the correct URL for Linux', async () => {
      ;(platform.getPlatform as jest.Mock).mockReturnValue('linux')
      Object.defineProperty(platform, 'IS_LINUX', { value: true, configurable: true })
      const version = '1.3.250.1'
      const expectedUrl = `https://sdk.lunarg.com/sdk/download/${version}/linux/vulkansdk-linux-x86_64-${version}.tar.gz`
      ;(http.isDownloadable as jest.Mock).mockResolvedValue(true)

      const url = await getUrlVulkanSdk(version)
      expect(url).toBe(expectedUrl)
    })

    it('should return the correct URL for Mac', async () => {
      ;(platform.getPlatform as jest.Mock).mockReturnValue('mac')
      Object.defineProperty(platform, 'IS_MAC', { value: true, configurable: true })
      const version = '1.3.290.0'
      const expectedUrl = `https://sdk.lunarg.com/sdk/download/${version}/mac/vulkansdk-macos-${version}.dmg`
      ;(http.isDownloadable as jest.Mock).mockResolvedValue(true)

      const url = await getUrlVulkanSdk(version)
      expect(url).toBe(expectedUrl)
    })
  })

  describe('getUrlVulkanRuntime', () => {
    it('should return the correct URL for Vulkan Runtime', async () => {
      ;(platform.getPlatform as jest.Mock).mockReturnValue('windows')
      const version = '1.3.216.0'
      const expectedUrl = `https://sdk.lunarg.com/sdk/download/${version}/windows/vulkan-runtime-components.zip`
      ;(versionsVulkan.getAvailableVersions as jest.Mock).mockResolvedValue({ versions: [version] })
      ;(http.isDownloadable as jest.Mock).mockResolvedValue(true)

      const url = await getUrlVulkanRuntime(version)
      expect(url).toBe(expectedUrl)
    })

    it('should try lower versions if the current version is not downloadable', async () => {
      ;(platform.getPlatform as jest.Mock).mockReturnValue('windows')
      const version = '1.3.216.0'
      const lowerVersion = '1.3.215.0'
      const expectedUrl = `https://sdk.lunarg.com/sdk/download/${lowerVersion}/windows/vulkan-runtime-components.zip`
      ;(versionsVulkan.getAvailableVersions as jest.Mock).mockResolvedValue({ versions: [version, lowerVersion] })
      ;(http.isDownloadable as jest.Mock).mockRejectedValueOnce(new Error('Not downloadable'))
      ;(http.isDownloadable as jest.Mock).mockResolvedValue(true)
      ;(versionsVulkan.getLowerVersion as jest.Mock).mockResolvedValue(lowerVersion)

      const url = await getUrlVulkanRuntime(version)
      expect(url).toBe(expectedUrl)
    })
  })

  describe('downloadVulkanSdk', () => {
    it('should download the Vulkan SDK and return the path', async () => {
      const version = '1.3.216.0'
      const url = `https://sdk.lunarg.com/sdk/download/${version}/windows/VulkanSDK-${version}-Installer.exe`
      const expectedPath = `/tmp/VulkanSDK-Installer.exe`

      jest.spyOn(require('../src/downloader'), 'getUrlVulkanSdk').mockResolvedValue(url)
      ;(tc.downloadTool as jest.Mock).mockResolvedValue(expectedPath)

      const sdkPath = await downloadVulkanSdk(version)
      expect(sdkPath).toBe(expectedPath)
    })
  })

  describe('downloadVulkanRuntime', () => {
    it('should download the Vulkan Runtime and return the path', async () => {
      const version = '1.3.216.0'
      const url = `https://sdk.lunarg.com/sdk/download/${version}/windows/vulkan-runtime-components.zip`
      const expectedPath = `/tmp/vulkan-runtime-components.zip`

      jest.spyOn(require('../src/downloader'), 'getUrlVulkanRuntime').mockResolvedValue(url)
      ;(tc.downloadTool as jest.Mock).mockResolvedValue(expectedPath)

      const runtimePath = await downloadVulkanRuntime(version)
      expect(runtimePath).toBe(expectedPath)
    })
  })

  describe('getVulkanSdkFilename', () => {
    it('should return the correct filename for Windows', () => {
      Object.defineProperty(platform, 'IS_WINDOWS', { value: true, configurable: true })
      const version = '1.3.216.0'
      const expectedFilename = 'VulkanSDK-Installer.exe'

      const filename = getVulkanSdkFilename(version)
      expect(filename).toBe(expectedFilename)
    })

    it('should return the correct filename for Linux', () => {
      Object.defineProperty(platform, 'IS_LINUX', { value: true, configurable: true })
      const version = '1.3.250.1'
      const expectedFilename = 'vulkansdk-linux-x86_64.tar.gz'

      const filename = getVulkanSdkFilename(version)
      expect(filename).toBe(expectedFilename)
    })

    it('should return the correct filename for Mac', () => {
      Object.defineProperty(platform, 'IS_MAC', { value: true, configurable: true })
      const version = '1.3.290.0'
      const expectedFilename = 'vulkansdk-macos.dmg'

      const filename = getVulkanSdkFilename(version)
      expect(filename).toBe(expectedFilename)
    })
  })
})
