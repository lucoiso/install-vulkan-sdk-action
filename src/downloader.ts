/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as core from '@actions/core'
import * as tc from '@actions/tool-cache' // https://github.com/actions/toolkit/tree/main/packages/tool-cache
import * as path from 'node:path'
import * as http from './http'
import * as errors from './errors'
import * as platform from './platform'
import * as versions from './versions'
import * as versionsVulkan from './versions_vulkan'

/**
 * Get download url for Vulkan SDK.
 *
 * @export
 * @param {string} version - The SDK version to download.
 * @return {*}  {Promise<string>} Returns the download url.
 */
export async function getUrlVulkanSdk(version: string): Promise<string> {
  const platformName = platform.getPlatform() // For download urls see https://vulkan.lunarg.com/sdk/home

  // Windows:
  // Latest Version:  https://sdk.lunarg.com/sdk/download/latest/windows/vulkan-sdk.exe
  // Versionized:     https://sdk.lunarg.com/sdk/download/1.3.250.1/windows/VulkanSDK-1.3.250.1-Installer.exe
  // Since 1.4.313.0: https://sdk.lunarg.com/sdk/download/1.4.313.0/windows/vulkansdk-windows-X64-1.4.313.0.exe
  //
  // Warm (Windows ARM64):
  // Latest Version:  https://sdk.lunarg.com/sdk/download/latest/warm/vulkan_sdk.exe
  // Versionized:     https://sdk.lunarg.com/sdk/download/1.4.304.0/warm/InstallVulkanARM64-1.4.304.0.exe
  // Sicne 1.4.313.0: https://sdk.lunarg.com/sdk/download/1.4.313.0/warm/vulkansdk-windows-ARM64-1.4.313.0.exe

  const downloadBaseUrl = `https://sdk.lunarg.com/sdk/download/${version}/${platformName}`

  let vulkanSdkUrl = ''

  // note: condition order matters, e.g. IS_WINDOWS_ARM before IS_WINDOWS

  if (platform.IS_WINDOWS_ARM) {
      vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-windows-ARM64-${version}.exe`
  } else if (platform.IS_WINDOWS) {
      vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-windows-X64-${version}.exe`
  } else if (platform.IS_LINUX_ARM) {
    let distributionVersion = '24.04' // default to 24.04
    if (platform.getLinuxDistributionVersionId() === '22.04') {
      distributionVersion = '22.04'
    }
    // https://github.com/jakoch/vulkan-sdk-arm/releases/download/1.4.304.0/vulkansdk-ubuntu-22.04-arm-1.4.304.0.tar.xz
    const downloadBaseUrl = `https://github.com/jakoch/vulkan-sdk-arm/releases/download/${version}`
    vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-ubuntu-${distributionVersion}-arm-${version}.tar.xz`
  } else if (platform.IS_LINUX) {
    vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-linux-x86_64-${version}.tar.xz`
  } else if (platform.IS_MAC) {
    vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-macos-${version}.zip`
  }

  await http.isDownloadable('VULKAN_SDK', version, vulkanSdkUrl)

  return vulkanSdkUrl
}

/**
 * Get download URL for Vulkan Runtime.
 *
 * Windows:
 * Latest Version:  https://sdk.lunarg.com/sdk/download/latest/windows/vulkan-runtime-components.zip
 * Versionized:     https://sdk.lunarg.com/sdk/download/1.3.250.1/windows/VulkanRT-1.3.250.1-Components.zip
 *
 * Warm (Windows ARM64):
 * Latest Version:  https://sdk.lunarg.com/sdk/download/latest/warm/vulkan-runtime-components.zip
 * Normalized:      https://sdk.lunarg.com/sdk/download/1.4.304.0/warm/vulkan-runtime-components.zip
 * Versionized:     https://sdk.lunarg.com/sdk/download/1.4.304.0/warm/VulkanRT-ARM64-1.4.304.0-Installer.exe
 *
 * @export
 * @param {string} version - The runtime version to download.
 * @return {*}  {Promise<string>} Returns the download url.
 */
export async function getUrlVulkanRuntime(version: string): Promise<string> {
  try {
    let currentVersion = version
    const platformName = platform.getPlatform()
    const availableVersions = await versionsVulkan.getAvailableVersions()

    if (availableVersions === null) {
      throw new Error('No available versions found')
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      let vulkanRuntimeUrl = ''
      if (platformName === 'windows') {
        // https://sdk.lunarg.com/sdk/download/1.3.250.1/windows/VulkanRT-1.3.250.1-Components.zip
        vulkanRuntimeUrl = `https://sdk.lunarg.com/sdk/download/${currentVersion}/${platformName}/VulkanRT-${currentVersion}-Components.zip`
      }
      if (platformName === 'warm') {
        // https://sdk.lunarg.com/sdk/download/1.4.309.0/warm/VulkanRT-ARM64-1.4.309.0-Components.zip
        vulkanRuntimeUrl = `https://sdk.lunarg.com/sdk/download/${currentVersion}/${platformName}/VulkanRT-ARM64-${currentVersion}-Components.zip`
      }
      try {
        // isDownloadable throws, if the download is not available
        await http.isDownloadable('VULKAN_RUNTIME', currentVersion, vulkanRuntimeUrl)
        return vulkanRuntimeUrl
      } catch (error) {
        // if download not available, try a lower version
        core.info(`Attempt ${attempt}: Vulkan runtime for version ${currentVersion} is not downloadable.`)
        core.info(`Available versions: ${JSON.stringify(availableVersions, null, 2)}`)

        const lowerVersion = await versionsVulkan.getLowerVersion(currentVersion, availableVersions.versions)

        if (lowerVersion === currentVersion) {
          core.info(`No lower version available for Vulkan runtime version ${currentVersion}.`)
        }

        core.info(`Trying to download using a lower version ${lowerVersion}...`)
        currentVersion = lowerVersion
      }
    }
    throw new Error('Failed to find a downloadable Vulkan runtime version after 3 attempts.')
  } catch (error) {
    errors.handleError(error as Error)
    throw error
  }
}

/**
 * Download Vulkan SDK.
 *
 * @export
 * @param {string} version - The version to download.
 * @return {*}  {Promise<string>} Download location.
 */
export async function downloadVulkanSdk(version: string): Promise<string> {
  core.info(`🔽 Downloading Vulkan SDK ${version}`)
  const url = await getUrlVulkanSdk(version)
  core.info(`    URL: ${url}`)
  const sdkPath = await tc.downloadTool(url, path.join(platform.TEMP_DIR, getVulkanSdkFilename(version)))
  core.info(`✔️ Download completed successfully!`)
  core.info(`   File: ${sdkPath}`)
  return sdkPath
}

/**
 * Download Vulkan Runtime (Windows only).
 *
 * @export
 * @param {string} version - The version to download.
 * @return {*}  {Promise<string>} Download location.
 */
export async function downloadVulkanRuntime(version: string): Promise<string> {
  core.info(`🔽 Downloading Vulkan Runtime ${version}`)
  const url = await getUrlVulkanRuntime(version)
  core.info(`   URL: ${url}`)
  const runtimePath = await tc.downloadTool(url, path.join(platform.TEMP_DIR, `vulkan-runtime-components.zip`))
  core.info(`✔️ Download completed successfully!`)
  core.info(`    File: ${runtimePath}`)
  return runtimePath
}

/**
 * Returns the platform-based name for the Vulkan SDK archive or installer.
 *
 * @export
 * @param {string} version- The vulkan sdk version number string.
 * @return {*}  {string} Platform-based name for the Vulkan SDK archive or installer.
 */
export function getVulkanSdkFilename(version: string): string {
  if (platform.IS_WINDOWS || platform.IS_WINDOWS_ARM) {
    // The download name is "VulkanSDK-Installer.exe" for both
    // "vulkansdk-windows-X64-${version}.exe" and
    // "vulkansdk-windows-ARM64-${version}.exe".
    return `VulkanSDK-Installer.exe`
  }
  if (platform.IS_LINUX || platform.IS_LINUX_ARM) {
      return `vulkansdk-linux-x86_64.tar.xz`
  }
  if (platform.IS_MAC) {
      return `vulkansdk-macos.zip`
  }
  return 'not-implemented-for-platform'
}
