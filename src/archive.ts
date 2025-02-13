/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as tc from '@actions/tool-cache'
import * as platform from './platform'

/**
 * Extracts an archive file to a specified destination based on the platform and file type.
 *
 * @param {string} file - The path to the archive file to be extracted.
 * @param {string} destination - The destination directory where the archive contents will be extracted.
 * @return {*}  {Promise<string>} A Promise that resolves to the destination directory path after extraction.
 */
async function extract(file: string, destination: string): Promise<string> {
  const flags: string[] = []

  let extract: (
    file: string,
    destination: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flags: string[]
  ) => Promise<string> = (file, destination, flags) => {
    throw new Error('Extraction function is not properly assigned.')
  }

  if (platform.IS_WINDOWS || platform.IS_WINDOWS_ARM) {
    if (file.endsWith('.exe')) {
      // No extraction needed for .exe files
      return destination
    } else if (file.endsWith('.zip')) {
      extract = (file, destination) => tc.extractZip(file, destination)
    } else if (file.endsWith('.7z')) {
      extract = (file, destination) => tc.extract7z(file, destination)
    }
  } else if (platform.IS_MAC) {
    if (file.endsWith('.zip')) {
      extract = (file, destination) => tc.extractZip(file, destination)
    } else if (file.endsWith('.dmg')) {
      // No extraction needed for .dmg files, we just mount them
      return destination
    }
  } else if (platform.IS_LINUX || platform.IS_LINUX_ARM) {
    if (file.endsWith('.tar.gz')) {
      // extractTar defaults to 'xz' (extracting gzipped tars).
      extract = (file, destination) => tc.extractTar(file, destination)
    } else if (file.endsWith('.tar.xz')) {
      // https://www.man7.org/linux/man-pages/man1/tar.1.html
      // -J or --xz = filter archive through xz
      // -x for extract
      // note: ".tar.bz2" is "-xj"
      flags.push('-xJ')
      extract = (file, destination, flags) => tc.extractTar(file, destination, flags)
    }
  }

  return await extract(file, destination, flags)
}
