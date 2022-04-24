import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import ProcessError from './ProcessError'

class Git {
  cwd: string
  cmd: string
  output: string

  /**
   * Clone a repo into the given dir if it doesn't already exist.
   * @param {string} repo Repository URL.
   * @param {string} dir Target directory.
   * @param {string} branch Branch name.
   * @param {options} options All options.
   * @return {Promise<Git>} A promise.
   */
  static async clone(
    repo: string,
    dir: string,
    branch: string,
    {
      depth,
      git = '',
      remote = 'origin',
    }: { branch?: string; depth?: number; git?: string; remote?: string },
  ): Promise<Git | undefined> {
    if (fs.existsSync(dir)) {
      return new Git({ cwd: dir, cmd: git })
    } else {
      mkdirpSync(path.dirname(path.resolve(dir)))

      const args = [
        'clone',
        repo,
        dir,
        '--branch',
        branch,
        '--single-branch',
        '--origin',
        remote,
        '--depth',
        depth,
      ] as string[]

      try {
        spawn(git, args)
        return new Git({ cwd: dir, cmd: git })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error(err)
        // Try again without branch or depth options
        spawn(git, ['clone', repo, dir, '--origin', remote])
      }
    }
  }

  constructor(opts?: { cwd?: string; cmd?: string }) {
    this.cwd = opts?.cwd || '.'
    this.cmd = opts?.cwd || ''
    this.output = ''
  }

  /**
   * Add files.
   * @param files Files argument.
   */
  add(files: string | string[]) {
    if (!Array.isArray(files)) files = [files]
    return this.exec('add', ...files)
  }

  /**
   * Checkout a branch (create an orphan if it doesn't exist on the remote).
   * @param remote Remote alias.
   * @param branch Branch name.
   */
  async checkout(remote: string, branch: string) {
    const treeish = remote + '/' + branch
    await this.exec('ls-remote', '--exit-code', '.', treeish)

    try {
      // Branch exists on remote, hard reset
      await this.exec('checkout', branch)
      await this.clean()
      await this.reset(remote, branch)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (err instanceof ProcessError && err.code === 2) {
        // branch doesn't exist, create an orphan
        return this.exec('checkout', '--orphan', branch)
      } else {
        throw err
      }
    }
  }

  /**
   * Cleans up unversioned files.
   */
  clean() {
    return this.exec('clean', '-f', '-d')
  }

  /**
   * Commit (if there are any changes).
   * @param message Commit message.
   */
  async commit(message: string) {
    try {
      await this.exec('diff-index', '--quiet', 'HEAD')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(err)
      await this.exec('commit', '-m', message)
    }
  }

  /**
   * Delete ref to remove branch history
   * @param branch
   */
  deleteRef(branch: string) {
    return this.exec('update-ref', '-d', 'refs/heads/' + branch)
  }

  /**
   * Executes an arbitrary git command.
   * @param args Arguments (e.g. 'remote', 'update').
   */
  async exec(...args: string[]) {
    this.output = (await this.spawn(this.cmd, args, this.cwd)) as string
    return this
  }

  /**
   * Fetch from a remote repository
   * @param remote Remote alias.
   */
  fetch(remote: string) {
    return this.exec('fetch', remote)
  }

  /**
   * Get the URL for a remote.
   * @param remote Remote alias.
   */
  async getRemoteUrl(remote: string) {
    try {
      const git = await this.exec(
        'config',
        '--get',
        'remote.' + remote + '.url',
      )

      const repo = git.output && git.output.split(/[\n\r]/).shift()

      if (repo) {
        return repo
      } else {
        throw new Error(
          'Failed to get repo URL from options or current directory.',
        )
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(err)
      throw new Error(
        'Failed to get remote.' +
          remote +
          '.url (task must either be ' +
          'run in a git repository with a configured ' +
          remote +
          ' remote ' +
          'or must be configured with the "repo" option).',
      )
    }
  }

  /**
   * Initializes a repository
   */
  init() {
    return this.exec('init')
  }

  /**
   * Push a branch.
   * @param remote Remote alias.
   * @param branch Branch name.
   * @param force Force push.
   */
  push(remote: string, branch: string, force = false) {
    const args = ['push', '--tags', remote, branch]
    if (force) args.push('--force')
    return this.exec(...args)
  }

  /**
   * Remove all unversioned files.
   * @param files A filepath string or an array of filepaths
   */
  rm(files: string | string[]) {
    if (!Array.isArray(files)) files = [files]
    return this.exec('rm', '--ignore-unmatch', '-r', '-f', ...files)
  }

  /**
   * Hard reset to remote/branch
   * @param remote Remote alias.
   * @param branch Branch name.
   */
  reset(remote: string, branch: string) {
    return this.exec('reset', '--hard', remote + '/' + branch)
  }

  /**
   * Util function for handling spawned processes as promises.
   * @param exe Executable.
   * @param args Arguments.
   * @param cwd Working directory.
   * @return A promise of the output
   */
  spawn(exe: string, args: string | string[], cwd: string = process.cwd()) {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(args)) args = [args]

      const child = spawn(exe, args, { cwd })
      const buffer = [] as string[]

      child.stderr.on('data', (chunk: Buffer) => {
        buffer.push(chunk.toString())
      })

      child.stdout.on('data', (chunk: Buffer) => {
        buffer.push(chunk.toString())
      })

      child.on('close', (code) => {
        const output = buffer.join('')
        if (code) {
          const msg = output || 'Process failed: ' + code
          reject(new ProcessError(code, msg))
        } else {
          resolve(output)
        }
      })
    })
  }

  /**
   * Add tag
   * @param name Name of tag.
   */
  tag(name: string) {
    return this.exec('tag', name)
  }
}

export default Git
