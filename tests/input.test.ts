/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path'
import * as inputs from '../src/inputs'
import { getInputs } from '../src/inputs'
import * as core from '@actions/core'

// Mock the core.getInput function
jest.mock('@actions/core')

describe('getInputs', () => {
  afterEach(() => {
    jest.resetModules() // Reset modules after each test
    jest.restoreAllMocks() // Restore all mocks
    jest.clearAllMocks() // Clear spy call history
  })

  it('should return expected input values', async () => {
    // Mock core.getInput behavior
    ;(core.getInput as jest.Mock).mockImplementation((name: string) => {
      const mockInputs: Record<string, string> = {
        // vulkan
        vulkan_version: '1.3.261.1',
        destination: '/some/path',
        install_runtime: 'true',
        cache: 'false',
        // invalid components are filtered out, so the expected array is empty
        optional_components: 'someInvalidComponent,anotherInvalidComponent',
        stripdown: 'false',
        // swiftshader
        installSwiftshader: 'false',
        swiftshaderDestination: '/home/runner/swiftshader',
        // lavapipe
        installLavapipe: 'false',
        lavapipeDestination: '/home/runner/lavapipe'
      }
      return mockInputs[name] || ''
    })

    // Call getInputs and check the result
    await expect(getInputs()).resolves.toEqual({
      // vulkan
      version: '1.3.261.1',
      destination: '/some/path',
      installRuntime: true,
      useCache: false,
      optionalComponents: [],
      stripdown: false,
      // swiftshader
      installSwiftshader: false,
      swiftshaderDestination: '/home/runner/swiftshader',
      // lavapipe
      installLavapipe: false,
      lavapipeDestination: '/home/runner/lavapipe'
    })
  })
})

describe('validateVersion', () => {
  it('should return true for a valid version string "1.2.3.4"', () => {
    expect(inputs.validateVersion('1.2.3.4')).toBe(true)
  })

  it('should return false for a version string with missing components "1.2.3"', () => {
    expect(inputs.validateVersion('1.2.3')).toBe(false)
  })

  it('should return false for a version string with non-numeric characters "v1.2.3.4"', () => {
    expect(inputs.validateVersion('v1.2.3.4')).toBe(false)
  })

  it('should return false for an empty version string', () => {
    expect(inputs.validateVersion('')).toBe(false)
  })
})

describe('getInputDestination', () => {
  afterEach(() => {
    jest.resetModules() // Reset modules after each test
    jest.restoreAllMocks() // Restore all mocks
    jest.clearAllMocks() // Clear spy call history
  })

  it('should return normalized provided destination if non-empty', () => {
    const provided = 'my/custom/../destination'
    const normalized = path.normalize(provided)
    expect(inputs.getInputVulkanDestination(provided)).toEqual(normalized)
  })

  describe('when destination is empty', () => {
    let os: typeof import('node:os')

    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()

      jest.doMock('node:os', () => ({
        platform: jest.fn()
      }))

      os = require('node:os') // Reimport mocked os module
    })

    it('should return Windows default when platform is Windows', () => {
      ;(os.platform as jest.Mock).mockReturnValue('win32')

      jest.doMock('../src/platform', () => ({
        IS_WINDOWS: true,
        HOME_DIR: 'C:\\Users\\Test',
        OS_PLATFORM: 'windows'
      }))

      const platform = require('../src/platform')
      const inputs = require('../src/inputs')

      expect(os.platform()).toBe('win32')
      expect(platform.OS_PLATFORM).toBe('windows')

      const expected = path.normalize('C:\\VulkanSDK\\')
      expect(inputs.getInputVulkanDestination('')).toEqual(expected)
    })

    it('should return Linux default when platform is Linux', () => {
      ;(os.platform as jest.Mock).mockReturnValue('linux')

      jest.doMock('../src/platform', () => ({
        IS_LINUX: true,
        HOME_DIR: '/home/test',
        OS_PLATFORM: 'linux'
      }))

      const platform = require('../src/platform')
      const inputs = require('../src/inputs')

      expect(os.platform()).toBe('linux')
      expect(platform.OS_PLATFORM).toBe('linux')

      const expected = path.normalize('/home/test/vulkan-sdk')
      expect(inputs.getInputVulkanDestination('')).toEqual(expected)
    })

    it('should return macOS default when platform is macOS', () => {
      ;(os.platform as jest.Mock).mockReturnValue('darwin')

      jest.doMock('../src/platform', () => ({
        IS_MAC: true,
        HOME_DIR: '/home/test',
        OS_PLATFORM: 'darwin'
      }))

      const platform = require('../src/platform')
      const inputs = require('../src/inputs')

      expect(os.platform()).toBe('darwin')
      expect(platform.OS_PLATFORM).toBe('darwin')

      const expected = path.normalize('/home/test/vulkan-sdk')
      expect(inputs.getInputVulkanDestination('')).toEqual(expected)
    })
  })
})
