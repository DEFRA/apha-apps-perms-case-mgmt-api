import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Go up from src/utils to src
export const srcFolder = path.resolve(__dirname, '../..')
