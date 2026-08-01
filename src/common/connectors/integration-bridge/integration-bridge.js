import { Buffer } from 'node:buffer'

import { Wreck } from './requests.js'
import { config } from '../../../config.js'

function normalizeKeyFactValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'object') {
    if (typeof value.value === 'string') {
      return value.value.trim()
    }
    if (typeof value.answer === 'string') {
      return value.answer.trim()
    }
    if (value.value !== undefined && value.value !== null) {
      return String(value.value).trim()
    }
    if (value.answer !== undefined && value.answer !== null) {
      return String(value.answer).trim()
    }
  }

  return ''
}

function extractCphs(payload) {
  const cphs = []
  const keyFacts = payload?.keyFacts

  if (!keyFacts || typeof keyFacts !== 'object') {
    return cphs
  }

  const originCph = normalizeKeyFactValue(keyFacts.originCph)
  const destinationCph = normalizeKeyFactValue(keyFacts.destinationCph)

  if (originCph) {
    cphs.push({ cph: originCph, type: 'origin' })
  }

  if (destinationCph) {
    cphs.push({ cph: destinationCph, type: 'destination' })
  }

  return cphs
}

async function getAccessToken({ logger, timeout }) {
  const tokenUrl = config.get('integrationBridge.tokenUrl')
  const clientId = config.get('integrationBridge.clientId')
  const clientSecret = config.get('integrationBridge.clientSecret')

  if (!tokenUrl || !clientId || !clientSecret) {
    return null
  }

  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  }).toString()

  try {
    const response = await Wreck.post(tokenUrl, {
      payload,
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout
    })

    const statusCode = response.res?.statusCode ?? 0
    if (statusCode < 200 || statusCode >= 300) {
      logger.debug(
        { status: statusCode },
        'Integration Bridge token request returned a non-OK response'
      )
      return null
    }

    let body
    try {
      body = JSON.parse(
        Buffer.isBuffer(response.payload)
          ? response.payload.toString('utf8')
          : response.payload?.toString() || '{}'
      )
    } catch {
      return null
    }

    return typeof body?.access_token === 'string' ? body.access_token : null
  } catch (error) {
    logger.debug(
      { err: error },
      'Failed to fetch Integration Bridge access token'
    )
    return null
  }
}

/**
 * @typedef {{payload: any, applicationId: string, logger: import('pino').Logger}} RunCphMatchingOptions
 */

/**
 * @param {RunCphMatchingOptions} options
 */
export async function runCphMatching({ payload, applicationId, logger }) {
  const enabled = config.get('featureFlags.cphMatchingEnabled')
  if (!enabled) {
    return
  }

  const cphs = extractCphs(payload)
  if (cphs.length === 0) {
    return
  }

  const baseUrl = config.get('integrationBridge.baseUrl')
  const timeout = config.get('integrationBridge.timeout')

  if (!baseUrl) {
    logger.debug(
      'Integration Bridge baseUrl not configured — skipping CPH matching'
    )
    return
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/holdings/find`
  const accessToken = await getAccessToken({ logger, timeout })
  const headers = { 'Content-Type': 'application/json' }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let response
  try {
    response = await Wreck.post(url, {
      payload: JSON.stringify({ ids: cphs.map((item) => item.cph) }),
      headers,
      timeout
    })
  } catch (error) {
    logger.debug(
      { err: error },
      'Failed to call Integration Bridge for CPH matching'
    )
    return
  }

  const statusCode = response.res?.statusCode ?? 0
  if (statusCode < 200 || statusCode >= 300) {
    logger.debug(
      { status: statusCode },
      'Integration Bridge responded with non-OK'
    )
    return
  }

  let body
  try {
    body = JSON.parse(
      Buffer.isBuffer(response.payload)
        ? response.payload.toString('utf8')
        : response.payload?.toString() || '{}'
    )
  } catch (error) {
    logger.debug({ err: error }, 'Failed to parse Integration Bridge response')
    return
  }

  const foundIds = Array.isArray(body.data)
    ? body.data.map((item) => String(item.id || '').trim()).filter(Boolean)
    : []

  for (const { cph, type } of cphs) {
    const match = {
      applicationCph: cph,
      result: foundIds.includes(cph),
      type,
      applicationId
    }

    logger.info({ cphMatch: match }, 'CPH match result')
  }
}
