/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as os from 'node:os'
import * as fs from 'node:fs'
import * as platform from '../src/platform'

jest.mock('node:os')
jest.mock('node:fs')

describe('Platform constants', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('platform.HOME_DIR should return the home directory', () => {
    jest.resetModules()
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      IS_LINUX: jest.fn().mockReturnValue(true),
      OS_PLATFORM: 'linux',
      HOME_DIR: '/home/user'
    }))
    ;(os.platform as jest.Mock).mockReturnValue('linux')
    const mockedPlatform = require('../src/platform')
    expect(os.platform()).toBe('linux')
    expect(mockedPlatform.OS_PLATFORM).toBe('linux')
    // finally
    expect(mockedPlatform.HOME_DIR).toBe('/home/user')
  })

  test('platform.OS_ARCH should return the architecture', () => {
    jest.resetModules()
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      OS_ARCH: 'x64'
    }))
    ;(os.arch as jest.Mock).mockReturnValue('x64')
    const mockedPlatform = require('../src/platform')
    expect(os.arch()).toBe('x64')
    expect(mockedPlatform.OS_ARCH).toBe('x64')
  })

  test('platform.IS_WINDOWS should return true if the platform is windows', () => {
    jest.resetModules()
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      OS_PLATFORM: 'windows',
      IS_WINDOWS: true
    }))
    ;(os.platform as jest.Mock).mockReturnValue('windows')
    const mockedPlatform = require('../src/platform')
    expect(os.platform()).toBe('windows')
    expect(mockedPlatform.OS_PLATFORM).toBe('windows')
    expect(mockedPlatform.IS_WINDOWS).toBe(true)
  })

  test('platform.IS_WINDOWS should return false if the platform is not windows', () => {
    ;(os.platform as jest.Mock).mockReturnValue('linux')
    expect(os.platform()).toBe('linux')
    expect(platform.IS_LINUX).toBe(true)
    expect(platform.IS_WINDOWS).toBe(false)
  })

  test('platform.IS_WINDOWS_ARM should return to if the platform is windows arm', () => {
    ;(os.platform as jest.Mock).mockReturnValue('win32')
    ;(os.arch as jest.Mock).mockReturnValue('arm64')
    // the mock values
    expect(os.platform()).toBe('win32')
    expect(os.arch()).toBe('arm64')
    // the constants
    expect(platform.IS_WINDOWS).toBe(true)
    expect(platform.OS_ARCH).toBe('arm64')
    // the combined constant
    expect(platform.IS_WINDOWS_ARM).toBe(true)
  })

  test('platform.IS_LINUX_ARM should return to if the platform is linux arm', () => {
    ;(os.platform as jest.Mock).mockReturnValue('linux')
    ;(os.arch as jest.Mock).mockReturnValue('arm64')
    // the mock values
    expect(os.platform()).toBe('linux')
    expect(os.arch()).toBe('arm64')
    // the constants
    expect(platform.IS_LINUX).toBe(true)
    expect(platform.OS_ARCH).toBe('arm64')
    //finally
    expect(platform.IS_LINUX_ARM).toBe(true)
  })
})

describe('Platform detection', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should return windows for win32', () => {
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      IS_WINDOWS: jest.fn().mockReturnValue(true),
      OS_PLATFORM: 'win32',
      getPlatform: jest.fn().mockReturnValue('windows')
    }))
    ;(os.platform as jest.Mock).mockReturnValue('win32')
    const mockedPlatform = require('../src/platform')
    expect(mockedPlatform.OS_PLATFORM).toBe('win32')
    expect(mockedPlatform.IS_WINDOWS()).toBe(true)
    expect(mockedPlatform.getPlatform()).toBe('windows')
  })

  test('should return mac for darwin', () => {
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      IS_MAC: jest.fn().mockReturnValue(true),
      OS_PLATFORM: 'darwin',
      getPlatform: jest.fn().mockReturnValue('mac')
    }))
    ;(os.platform as jest.Mock).mockReturnValue('darwin')
    const mockedPlatform = require('../src/platform')
    expect(mockedPlatform.OS_PLATFORM).toBe('darwin')
    expect(mockedPlatform.IS_MAC()).toBe(true)
    expect(mockedPlatform.getPlatform()).toBe('mac')
  })

  test('should return linux for linux', () => {
    jest.doMock('../src/platform', () => ({
      __esModule: true,
      IS_LINUX: jest.fn().mockReturnValue(true),
      OS_PLATFORM: 'linux',
      getPlatform: jest.fn().mockReturnValue('linux')
    }))
    ;(os.platform as jest.Mock).mockReturnValue('linux')
    const mockedPlatform = require('../src/platform')
    expect(mockedPlatform.OS_PLATFORM).toBe('linux')
    expect(mockedPlatform.getPlatform()).toBe('linux')
  })
})

describe('Linux Distribution Version Detection', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should return Linux distribution version from /etc/os-release', () => {
    const mockContent = 'VERSION_ID="24.04"'
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockContent)
    expect(platform.getLinuxDistributionVersionId()).toBe('24.04')
  })

  test('should return empty string if /etc/os-release does not exist', () => {
    ;(fs.existsSync as jest.Mock).mockReturnValue(false)
    expect(platform.getLinuxDistributionVersionId()).toBe('')
  })

  test('should return empty string if VERSION_ID is missing', () => {
    const mockContent = 'NAME="Ubuntu"'
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockContent)
    expect(platform.getLinuxDistributionVersionId()).toBe('')
  })
})
