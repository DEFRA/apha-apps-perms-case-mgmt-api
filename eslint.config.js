import neostandard from 'neostandard'
import { readFileSync } from 'node:fs'

const gitignoreEntries = readFileSync(
  new URL('./.gitignore', import.meta.url),
  'utf8'
)
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'))

const ignores = gitignoreEntries.flatMap((entry) => [entry, `${entry}/**`])

export default neostandard({
  env: ['node', 'jest'],
  ignores,
  noJsx: true,
  noStyle: true
})
