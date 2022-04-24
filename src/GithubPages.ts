import fs from 'fs'
import { join as joinPath } from 'path'
import { sync as fgSync } from 'fast-glob'
import filenamify from 'filenamify'
import findCacheDir from 'find-cache-dir'
import Git from './Git'
import copy from './copy'

const log = console.log

export interface GithubPagesOptions {
  add?: boolean
  branch?: string
  depth?: number
  destination?: string
  dotfiles?: boolean
  git?: string
  history?: boolean
  message?: string
  push?: boolean
  remote?: string
  silent?: boolean
  src?: string
}

/**
 * Retrieves the cache directory.
 * @param optPath Optional path.
 * @returns {string} The full path to the cache directory.
 */
function getCacheDir(optPath?: string) {
  const dir = findCacheDir({ name: 'gh-pages' })
  if (!optPath) return dir
  return joinPath(dir as string, filenamify(optPath))
}

class GithubPages {
  add: boolean
  branch: string
  depth: number
  destination: string
  dotfiles: boolean
  git: string
  history: boolean
  message: string
  push: boolean
  remote: string
  silent: boolean
  src: string

  constructor(opts?: GithubPagesOptions) {
    this.add = opts?.add || false
    this.branch = opts?.branch || 'origin'
    this.depth = opts?.depth || 1
    this.destination = opts?.destination || '.'
    this.dotfiles = opts?.dotfiles || false
    this.git = opts?.git || 'git'
    this.history = opts?.history || true
    this.message = opts?.message || 'Updates'
    this.push = opts?.push || true
    this.remote = opts?.remote || 'origin'
    this.silent = opts?.silent || false
    this.src = opts?.src || '**/*'
  }

  get options() {
    return {
      add: this.add,
      branch: this.branch,
      depth: this.depth,
      destination: this.destination,
      dotfiles: this.dotfiles,
      git: this.git,
      history: this.history,
      message: this.message,
      push: this.push,
      remote: this.remote,
      silent: this.silent,
      src: this.src,
    }
  }

  async publish(
    dir: string,
    { beforeAdd, getUser, repo, remove, tag, user: userProp } = {} as {
      beforeAdd?: (git: Git) => void
      getUser?: () =>
        | Promise<{ name: string; email: string }>
        | { name: string; email: string }
      repo?: string
      remove?: string
      tag?: string
      user?: { name: string; email: string }
    },
  ) {
    try {
      try {
        if (!fs.statSync(dir).isDirectory()) {
          throw new Error('The "base" option must be an existing directory')
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }

      const files = fgSync(this.options.src, {
        cwd: dir,
        dot: this.options.dotfiles,
      }).filter((file) => !fs.statSync(joinPath(dir, file)).isDirectory())

      if (!files?.length) {
        throw new Error(
          'The pattern in the "src" property didn\'t match any files.',
        )
      }

      let user = await (userProp || getUser?.())

      repo =
        repo ||
        (await new Git({
          cwd: process.cwd(),
          cmd: this.options.git,
        }).getRemoteUrl(this.options.remote))

      const clone = getCacheDir(repo) || ''

      log('Cloning %s into %s', repo, clone)

      const git = (await Git.clone(
        repo,
        clone,
        this.options.branch,
        this.options,
      )) as Git

      const url = await git.getRemoteUrl(this.options.remote)

      if (url !== repo) {
        const message =
          'Remote url mismatch.  Got "' +
          url +
          '" ' +
          'but expected "' +
          repo +
          '" in ' +
          git.cwd +
          '.  Try running the `gh-pages-clean` script first.'

        throw new Error(message)
      }

      // only required if someone mucks with the checkout between builds
      log('Cleaning')
      await git.clean()

      log('Fetching %s', this.options.remote)
      await git.fetch(this.options.remote)

      log('Checking out %s/%s ', this.options.remote, this.options.branch)
      await git.checkout(this.options.remote, this.options.branch)

      if (!this.options.history) {
        await git.deleteRef(this.options.branch)
      }

      if (this.options.add) {
      } else if (remove) {
        log('Removing files')

        const files = fgSync(remove, {
          cwd: joinPath(git.cwd, this.options.destination),
        }).map((file) => joinPath(this.options.destination, file))

        if (files.length > 0) await git.rm(files)
      }

      log('Copying files')

      await copy(files, dir, joinPath(git.cwd, this.destination))

      beforeAdd?.(git)

      log('Adding all')

      await git.add('.')

      if (user) {
        await git.exec('config', 'user.email', user.email)
        if (user.name) await git.exec('config', 'user.name', user.name)
      }

      log('Committing')
      await git.commit(this.options.message)

      if (tag) {
        log('Tagging')

        try {
          await git.tag(tag)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          // Tagging failed probably because this tag alredy exists
          log(err)
          log('Tagging failed, continuing')
        }
      }

      if (this.options.push) {
        log('Pushing')
        await git.push(
          this.options.remote,
          this.options.branch,
          !this.options.history,
        )
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }
}

export default GithubPages
