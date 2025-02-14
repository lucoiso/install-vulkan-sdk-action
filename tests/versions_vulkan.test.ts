import { getLowerVersion } from '../src/versions_vulkan'

describe('getLowerVersion', () => {
  it('should return the next lower version when given a higher version', async () => {
    const versions = ['1.4.304.0', '1.3.296.0', '1.3.290.0']

    await expect(getLowerVersion('1.4.304.0', versions)).resolves.toBe('1.3.296.0')
    await expect(getLowerVersion('1.3.296.0', versions)).resolves.toBe('1.3.290.0')
  })

  it('should return the same version if the provided version is the lowest version', async () => {
    const versions = ['1.4.304.0', '1.3.296.0', '1.3.290.0']

    await expect(getLowerVersion('1.3.290.0', versions)).resolves.toBe('1.3.290.0')
  })

  it('should return the same version if version not found in list', async () => {
    const versions = ['1.4.304.0', '1.3.296.0', '1.3.290.0']

    await expect(getLowerVersion('1.5.000.0', versions)).resolves.toBe('1.5.000.0')
  })

  it('should throw an error if available versions list is empty', async () => {
    const versions: string[] = []

    await expect(getLowerVersion('1.4.304.0', versions)).rejects.toThrow('No available versions found')
  })
})
