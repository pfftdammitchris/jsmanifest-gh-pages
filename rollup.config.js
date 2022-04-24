import { nodeResolve } from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'

const extensions = ['.ts']

/**
 * @type { import('rollup').RollupOptions }
 */
const configs = {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.cjs',
      format: 'cjs',
      name: 'jsmGhPages',
      strict: true,
    },
    {
      file: './dist/index.mjs',
      format: 'esm',
      name: 'jsmGhPages',
      strict: true,
    },
  ],
  plugins: [
    alias({
      entries: [
        {
          find: 'find-cache-dir',
          replacement: 'node_modules/find-cache-dir/index.js',
        },
        { find: 'find-up', replacement: 'node_modules/find-up/index.js' },
        {
          find: 'locate-path',
          replacement: 'node_modules/locate-path/index.js',
        },
        { find: 'make-dir', replacement: 'node_modules/make-dir/index.js' },
        { find: 'p-limit', replacement: 'node_modules/p-limit/index.js' },
        { find: 'p-locate', replacement: 'node_modules/p-locate/index.js' },
        { find: 'p-try', replacement: 'node_modules/p-try/index.js' },
        { find: 'pkg-dir', replacement: 'node_modules/pkg-dir/index.js' },
        {
          find: 'path-exists',
          replacement: 'node_modules/path-exists/index.js',
        },
        { find: 'node:path', replacement: 'path' },
        {
          find: 'picomatch/lib/utils',
          replacement: 'node_modules/picomatch/lib/utils.js',
        },
      ],
    }),
    nodeResolve({
      exportConditions: ['requiire'],
      extensions,
      preferBuiltins: true,
    }),
    commonjs(),
    esbuild({
      include: /\.ts?$/,
      exclude: /node_modules/,
      keepNames: true,
      target: 'es2018',
    }),
    filesize(),
    progress(),
  ],
}

export default configs
