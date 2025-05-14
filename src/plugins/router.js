import { health } from '../routes/health.js'
import { submit } from '../routes/submit/submit.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health].concat(submit))
    }
  }
}

export { router }
