import path from 'node:path'
import { fileURLToPath } from 'node:url'

// inside tests, import.meta.url is undefined - a fallback
// to __filename is needed there
const fileName = fileURLToPath(import.meta.url ?? __filename)
const __dirname = path.dirname(fileName)

// Go up from src/utils to src
export const srcFolder = path.resolve(__dirname, '../..')
