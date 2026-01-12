import OneBlinkAppsError from './errors/oneBlinkAppsError'

import { getIdToken } from './forms-key'
import { formatQueryString } from './query-string'
import { getUserToken } from './user-token'

export async function generateHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  // Check auth service for a token if user is logged in
  const idToken = await getIdToken()
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`
  }
  const userToken = getUserToken()
  if (userToken) {
    headers['X-OneBlink-User-Token'] = userToken
  }

  return headers
}

export class HTTPError extends Error {
  status: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.status = statusCode
  }
}

export const fetchWithError: typeof fetch = async (url, options) => {
  try {
    return await fetch(url, options)
  } catch (error) {
    throw new OneBlinkAppsError(
      'We encountered a network related issue. Please ensure you are connected to the internet before trying again. If the problem persists, contact your administrator.',
      {
        title: 'Connectivity Issues',
        originalError: error as Error,
        isOffline: true,
      },
    )
  }
}

export async function fetchJSON<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetchWithError(url, options)

  if (response.status === 204) {
    // @ts-expect-error
    return
  }

  const body = await response.json()
  if (response.ok) {
    return body
  }

  throw new HTTPError(response.status, body.message)
}

export async function searchRequest<T>(
  url: string,
  searchParameters: Record<string, unknown>,
  abortSignal?: AbortSignal,
): Promise<T> {
  const queryStringParams = formatQueryString(searchParameters)
  const body = await getRequest<T>(`${url}?${queryStringParams}`, abortSignal)
  return body
}

export async function getRequest<T>(
  url: string,
  abortSignal?: AbortSignal,
): Promise<T> {
  const headers = await generateHeaders()
  headers['Cache-Control'] = 'no-store'
  return fetchJSON(url, {
    method: 'GET',
    headers,
    signal: abortSignal,
  })
}

export async function postRequest<OutT>(
  url: string,
  resource?: unknown,
  abortSignal?: AbortSignal,
): Promise<OutT> {
  const opts = {
    method: 'POST',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
    signal: abortSignal,
  }

  return fetchJSON(url, opts)
}

export async function putRequest<OutT>(
  url: string,
  resource: unknown,
  abortSignal?: AbortSignal,
): Promise<OutT> {
  const opts = {
    method: 'PUT',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
    signal: abortSignal,
  }

  return fetchJSON(url, opts)
}

export async function deleteRequest(
  url: string,
  abortSignal?: AbortSignal,
): Promise<void> {
  const opts = {
    method: 'DELETE',
    headers: await generateHeaders(),
    signal: abortSignal,
  }

  const res = await fetchWithError(url, opts)
  if (!res.ok) {
    const errorPayload = await res.json()
    throw new HTTPError(res.status, errorPayload.message)
  }
}
