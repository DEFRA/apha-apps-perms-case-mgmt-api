import hapi from '@hapi/hapi'

export const createBackendServer = async (port, routes) => {
  const server = hapi.server({
    port
  })
  server.route(routes)
  await server.initialize()
  await server.start()
  return server
}
