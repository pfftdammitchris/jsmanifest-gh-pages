# @jsmanifest/gh-pages

Publish files to a `gh-pages` branch on GitHub (or any other branch anywhere else).

This package is an extended version of `gh-pages` with TypeScript support

## Getting Started

```bash
npm install @jsmanifest/gh-pages --save-dev
```

This module requires Git `>=1.9`.

## Basic Usage

```js
var ghpages = require('@jsmanifest/gh-pages')

ghpages
  .publish('dist')
  .then(() => console.log('Published'))
  .catch(console.error)
```

## `publish`

```js
ghpages.publish(dir).then(() => {...})
// or...
ghpages.publish(dir, options).then(() => {...})
```

Calling this function will create a temporary clone of the current repository, create a `gh-pages` branch if one doesn't already exist, copy over all files from the base path, or only those that match patterns from the optional `src` configuration, commit all changes, and push to the `origin` remote.

If a `gh-pages` branch already exists, it will be updated with all commits from the remote before adding any commits from the provided `src` files.

**Note** that any files in the `gh-pages` branch that are _not_ in the `src` files **will be removed**. See the [`add` option](#optionsadd) if you don't want any of the existing files removed.

### <a id="dir">`dir`</a>

- type: `string`

The base directory for all source files (those listed in the `src` config property).

Example use:

```js
/**
 * Given the following directory structure:
 *
 *   dist/
 *     index.html
 *     js/
 *       site.js
 *
 * The usage below will create a `gh-pages` branch that looks like this:
 *
 *   index.html
 *   js/
 *     site.js
 *
 */
ghpages.publish('dist').then(() => {...})
```

### Options

The default options work for simple cases. The options described below let you push to alternate branches, customize your commit messages, and more.

#### <a id="optionssrc">options.src</a>

- type: `string|Array<string>`
- default: `'**/*'`

The [minimatch](https://github.com/isaacs/minimatch) pattern or array of patterns used to select which files should be published.

#### <a id="optionsbranch">options.branch</a>

- type: `string`
- default: `'gh-pages'`
- `-b | --branch <branch name>`

The name of the branch you'll be pushing to. The default uses GitHub's `gh-pages` branch, but this can be configured to push to any branch on any remote.

Example use of the `branch` option:

```js
/**
 * This task pushes to the `master` branch of the configured `repo`.
 */
ghpages.publish(
  'dist',
  {
    branch: 'master',
    repo: 'https://example.com/other/repo.git',
  },
).then(() => {...})
```

#### <a id="optionsdest">options.dest</a>

- type: `string`
- default: `'.'`

The destination folder within the destination branch. By default, all files are published to the root of the repository.

Example use of the `dest` option:

```js
/**
 * Place content in the static/project subdirectory of the target
 * branch.
 */
ghpages.publish(
  'dist',
  {
    dest: 'static/project',
  },
).then(() => {...})
```

#### <a id="optionsdotfiles">options.dotfiles</a>

- type: `boolean`
- default: `false`

Include dotfiles. By default, files starting with `.` are ignored unless they are explicitly provided in the `src` array. If you want to also include dotfiles that otherwise match your `src` patterns, set `dotfiles: true` in your options.

Example use of the `dotfiles` option:

```js
/**
 * The usage below will push dotfiles (directories and files)
 * that otherwise match the `src` pattern.
 */
ghpages.publish('dist', { dotfiles: true }).then(() => {...})
```

#### <a id="optionsadd">options.add</a>

- type: `boolean`
- default: `false`

Only add, and never remove existing files. By default, existing files in the target branch are removed before adding the ones from your `src` config. If you want the task to add new `src` files but leave existing ones untouched, set `add: true` in your options.

Example use of the `add` option:

```js
/**
 * The usage below will only add files to the `gh-pages` branch, never removing
 * any existing files (even if they don't exist in the `src` config).
 */
ghpages.publish('dist', { add: true }).then(() => {...})
```

#### <a id="optionsrepo">options.repo</a>

- type: `string`
- default: url for the origin remote of the current dir (assumes a git repository)
- `-r | --repo <repo url>`

By default, `gh-pages` assumes that the current working directory is a git repository, and that you want to push changes to the `origin` remote.

If instead your script is not in a git repository, or if you want to push to another repository, you can provide the repository URL in the `repo` option.

Example use of the `repo` option:

```js
/**
 * If the current directory is not a clone of the repository you want to work
 * with, set the URL for the repository in the `repo` option.  This usage will
 * push all files in the `src` config to the `gh-pages` branch of the `repo`.
 */
ghpages.publish(
  'dist',
  {
    repo: 'https://example.com/other/repo.git',
  },
).then(() => {...})
```

#### <a id="optionsremote">options.remote</a>

- type: `string`
- default: `'origin'`

The name of the remote you'll be pushing to. The default is your `'origin'` remote, but this can be configured to push to any remote.

Example use of the `remote` option:

```js
/**
 * This task pushes to the `gh-pages` branch of of your `upstream` remote.
 */
ghpages.publish(
  'dist',
  {
    remote: 'upstream',
  },
).then(() => {...})
```

#### <a id="optionstag">options.tag</a>

- type: `string`
- default: `''`

Create a tag after committing changes on the target branch. By default, no tag is created. To create a tag, provide the tag name as the option value.

#### <a id="optionsmessage">options.message</a>

- type: `string`
- default: `'Updates'`

The commit message for all commits.

Example use of the `message` option:

```js
/**
 * This adds commits with a custom message.
 */
ghpages.publish(
  'dist',
  {
    message: 'Auto-generated commit',
  },
).then(() => {...})
```

#### <a id="optionsuser">options.user</a>

- type: `Object`
- default: `null`

If you are running the `gh-pages` task in a repository without a `user.name` or `user.email` git config properties (or on a machine without these global config properties), you must provide user info before git allows you to commit. The `options.user` object accepts `name` and `email` string values to identify the committer.

Example use of the `user` option:

```js
ghpages.publish(
  'dist',
  {
    user: {
      name: 'Joe Code',
      email: 'coder@example.com',
    },
  },
).then(() => {...})
```

#### <a id="optionsuser">options.remove</a>

- type: `string`
- default: `'.'`

Removes files that match the given pattern (Ignored if used together with
`--add`). By default, `gh-pages` removes everything inside the target branch
auto-generated directory before copying the new files from `dir`.

Example use of the `remove` option:

```js
ghpages.publish(
  'dist',
  {
    remove: '*.json',
  },
).then(() => {...})
```

#### <a id="optionspush">options.push</a>

- type: `boolean`
- default: `true`

Push branch to remote. To commit only (with no push) set to `false`.

Example use of the `push` option:

```js
ghpages.publish('dist', { push: false }).then(() => {...})
```

#### <a id="optionshistory">options.history</a>

- type: `boolean`
- default: `true`

Push force new commit without parent history.

Example use of the `history` option:

```js
ghpages.publish('dist', { history: false }).then(() => {...})
```

#### <a id="optionssilent">options.silent</a>

- type: `boolean`
- default: `false`

Avoid showing repository URLs or other information in errors.

Example use of the `silent` option:

```js
/**
 * This configuration will avoid logging the GH_TOKEN if there is an error.
 */
ghpages.publish(
  'dist',
  {
    repo:
      'https://' + process.env.GH_TOKEN + '@github.com/user/private-repo.git',
    silent: true,
  },
).then(() => {...})
```

#### <a id="optionsbeforeadd">options.beforeAdd</a>

- type: `function`
- default: `null`

Custom callback that is executed right before `git add`.

The CLI expects a file exporting the beforeAdd function

```bash
gh-pages --before-add ./cleanup.js
```

Example use of the `beforeAdd` option:

```js
/**
 * beforeAdd makes most sense when `add` option is active
 * Assuming we want to keep everything on the gh-pages branch
 * but remove just `some-outdated-file.txt`
 */
ghpages.publish(
  'dist',
  {
    add: true,
    async beforeAdd(git) {
      return git.rm('./some-outdated-file.txt')
    },
  },
).then(() => {...})
```

#### <a id="optionsgit">options.git</a>

- type: `string`
- default: `'git'`

Your `git` executable.

Example use of the `git` option:

```js
/**
 * If `git` is not on your path, provide the path as shown below.
 */
ghpages.publish(
  'dist',
  {
    git: '/path/to/git',
  },
).then(() => {...})
```
