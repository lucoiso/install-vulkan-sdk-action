import { getLowerVersion } from '../src/versions_vulkan'
import * as versionsVulkanModule from '../src/versions_vulkan'

describe('getLowerVersion', () => {
  let mockAvailableVersions: jest.SpiedFunction<typeof versionsVulkanModule.getAvailableVersions>

  beforeEach(() => {
    mockAvailableVersions = jest.spyOn(versionsVulkanModule, 'getAvailableVersions')
  })

  afterEach(() => {
    jest.restoreAllMocks() // Completely resets mocks after each test
  })

  it('should return the next lower version when given a higher version', async () => {
    mockAvailableVersions.mockResolvedValue({ versions: ['1.4.304.0', '1.3.296.0', '1.3.290.0'] })

    await expect(getLowerVersion('1.4.304.0')).resolves.toBe('1.3.296.0')
    await expect(getLowerVersion('1.3.296.0')).resolves.toBe('1.3.290.0')
  })

  it('should return the same version if the provided version is the lowest version', async () => {
    mockAvailableVersions.mockResolvedValue({ versions: ['1.4.304.0', '1.3.296.0', '1.3.290.0'] })

    await expect(getLowerVersion('1.3.290.0')).resolves.toBe('1.3.290.0')
  })

  it('should throw an error if no available versions are returned', async () => {
    mockAvailableVersions.mockResolvedValue(null)

    await expect(getLowerVersion('1.4.304.0')).rejects.toThrow('No available versions found')
  })

  it('should throw an error if available versions list is empty', async () => {
    mockAvailableVersions.mockResolvedValue({ versions: [] })

    await expect(getLowerVersion('1.4.304.0')).rejects.toThrow('No available versions found')
  })
})
