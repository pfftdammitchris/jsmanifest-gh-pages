import {
  dirname as dirnamePath,
  join as joinPath,
  relative as relativePath,
  resolve as resolvePath,
  sep as sepPath,
} from 'path'
import { createReadStream, createWriteStream, stat } from 'fs'
import { sync as mkdirpSync } from 'mkdirp'

/**
 * Generate a list of unique directory paths given a list of file paths.
 * @param {Array.<string>} files List of file paths.
 * @return {Array.<string>} List of directory paths.
 */
function uniqueDirs(files: string | string[]) {
  if (!Array.isArray(files)) files = [files]

  const dirs = {}

  files.forEach((filepath) => {
    const parts = dirnamePath(filepath).split(sepPath)
    let partial = parts[0] || '/'
    dirs[partial] = true
    for (let i = 1, ii = parts.length; i < ii; ++i) {
      partial = joinPath(partial, parts[i])
      dirs[partial] = true
    }
  })

  return Object.keys(dirs)
}

async function copy(
  files: string | string[],
  base: string,
  destination: string,
) {
  if (!Array.isArray(files)) files = [files]

  const pairs = [] as { src: string; destination: string }[]
  const destFiles = [] as string[]

  files.forEach((file) => {
    const src = resolvePath(base, file)
    const relative = relativePath(base, src)
    const target = joinPath(destination, relative)
    pairs.push({ src, destination: target })
    destFiles.push(target)
  })

  const dirsCreating = uniqueDirs(destFiles).sort((a, b) => {
    const aParts = a.split(sepPath)
    const bParts = b.split(sepPath)
    const aLength = aParts.length
    const bLength = bParts.length
    let cmp = 0
    if (aLength < bLength) {
      cmp = -1
    } else if (aLength > bLength) {
      cmp = 1
    } else {
      let aPart, bPart
      for (let i = 0; i < aLength; ++i) {
        aPart = aParts[i]
        bPart = bParts[i]
        if (aPart < bPart) {
          cmp = -1
          break
        } else if (aPart > bPart) {
          cmp = 1
          break
        }
      }
    }
    return cmp
  })

  for (const dir of dirsCreating) {
    mkdirpSync(dir)
    await Promise.all(
      pairs.map(({ src, destination }) => {
        return new Promise((resolve) => {
          let called = false

          function done(err?: Error) {
            if (!called) {
              called = true
              resolve(err)
            }
          }

          const read = createReadStream(src)
          const write = createWriteStream(destination)

          read.on('error', done)
          write.on('error', done)
          write.on('close', done)
          read.pipe(write)
        })
      }),
    )
  }
}

export default copy
