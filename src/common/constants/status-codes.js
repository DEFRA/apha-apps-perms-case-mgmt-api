/**
 * @typedef {Record<string, number>} StatusCodes
 */
export const statusCodes = {
  ok: 200,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  imATeapot: 418,
  redirect: 302,
  serverError: 500,
  badGateway: 502,
  gatewayTimeout: 504
}
