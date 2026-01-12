import { add } from 'date-fns'
import {
  GeoscapeTypes,
  PointTypes,
  CivicaTypes,
  FormTypes,
  MiscTypes,
  APINSWTypes,
  SubmissionTypes,
  CPHCMSTypes,
} from '@oneblink/types'

import OneBlinkAppsError from '../services/errors/oneBlinkAppsError'
import { isOffline } from '../offline-service'
import {
  deleteRequest,
  fetchJSON,
  getRequest,
  HTTPError,
  postRequest,
  searchRequest,
  putRequest,
} from '../services/fetch'
import tenants from '../tenants'
import Sentry from '../Sentry'
import generateGenericError from './generate-generic-error'

/**
 * Search for geoscape addresses based on a partial address.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const result = await formService.searchGeoscapeAddresses(formId, {
 *   query: '123 N',
 *   maxNumberOfResults: 10
 *   stateTerritory: 'NSW'
 * })
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchGeoscapeAddresses(
  formId: number,
  queryParams: {
    query: string
    maxNumberOfResults?: number
    stateTerritory?: string
    dataset?: string
    addressType?: 'physical' | 'mailing' | 'all'
    excludeAliases?: boolean
  },
  abortSignal?: AbortSignal,
): Promise<GeoscapeTypes.GeoscapeAddressesSearchResult> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/geoscape/addresses`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get the details for a single geoscape address based on the Id of a geoscape
 * address resource.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const addressId = 'ABC123'
 * const result = await formService.getGeoscapeAddress(formId, addressId)
 * ```
 *
 * @param formId
 * @param addressId
 * @param abortSignal
 * @returns
 */
export async function getGeoscapeAddress(
  formId: number,
  addressId: string,
  abortSignal?: AbortSignal,
): Promise<GeoscapeTypes.GeoscapeAddress> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/geoscape/addresses/${addressId}`,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get a geoscape address from a latitude and longitude
 *
 * #### Example
 *
 * ```js
 * const lat = 41.9475427
 * const lng = -87.6562292
 * const formId = 1
 * const result = await formService.getGeoscapeReverseGeocoding({
 *   lat,
 *   lng,
 *   formId,
 * })
 * ```
 *
 * @param options
 * @returns
 */
export async function getGeoscapeReverseGeocoding({
  formId,
  lat,
  lng,
  abortSignal,
}: {
  formId: number
  lat: number
  lng: number
  abortSignal?: AbortSignal
}): Promise<{ reverseGeocodeResult: GeoscapeTypes.GeoscapeAddress }> {
  try {
    const urlParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    })
    return await getRequest(
      `${
        tenants.current.apiOrigin
      }/forms/${formId}/geoscape/reverse-geocode?${urlParams.toString()}`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          `Could not find address from ${lat},${lng}.`,
          {
            originalError: error,
            title: 'Address not found',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Search for Point addresses based on a partial address.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const result = await formService.searchPointAddresses(formId, {
 *   address: '123 N',
 *   maxNumberOfResults: 10
 *   stateTerritory: 'NSW'
 * })
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchPointAddresses(
  formId: number,
  queryParams: {
    address: string
    maxNumberOfResults?: number
    stateTerritory?: string
    dataset?: string
    addressType?: 'physical' | 'mailing' | 'all'
  },
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddressesSearchResult> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/addresses`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get the details for a single Point address based on the Id of a Point address
 * resource.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const addressId = 'ABC123'
 * const result = await formService.getPointAddress(formId, addressId)
 * ```
 *
 * @param formId
 * @param addressId
 * @param abortSignal
 * @returns
 */
export async function getPointAddress(
  formId: number,
  addressId: string,
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddress> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/addresses/${addressId}`,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get the details for a single NSW Point Cadastral Parcel record.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const parcelId = '1/234567'
 * const result = await formService.getPointCadastralParcel(
 *   formId,
 *   addressId,
 * )
 * ```
 *
 * @param formId
 * @param parcelId
 * @param abortSignal
 * @returns
 */
export async function getPointCadastralParcel(
  formId: number,
  parcelId: string,
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointCadastralParcelResponse> {
  try {
    const urlSearchParams = new URLSearchParams([['parcelId', parcelId]])
    return await getRequest(
      `${
        tenants.current.apiOrigin
      }/forms/${formId}/point/cadastral-parcels?${urlSearchParams.toString()}`,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Search for Point addresses v3 based on a partial address.
 *
 * #### Example
 *
 * -
 *
 * Const formId = 1 const result = await
 * formService.searchPointV3Addresses(formId, { address: '123 N', maxResults: 10
 * stateFilter: 'NSW' })
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchPointV3Addresses(
  formId: number,
  queryParams: {
    address: string
    maxResults?: number
    stateFilter?: string
    dataset?: string
    addressType?: 'physical' | 'mailing' | 'all'
    excludeAliases?: boolean
  },
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddressV3SearchResponse> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/v3/addresses`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get the details for a single Point address based on the Id of a Point address
 * resource.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const result = await formService.getPointV3Address(formId, {
 *   addressId: 'ABC123',
 *   'Accept-Crs': '<https://www.opengis.net/def/crs/EPSG/0/7844>',
 * })
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function getPointV3Address(
  formId: number,
  queryParams: {
    addressId: string
    'Accept-Crs'?: string
  },
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddressV3GetAddressDetailsResponse> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/v3/address`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Search for street names in Civica
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const queryParams = {
 *   search: '1 Station ',
 *   top: 10,
 * }
 * const result = await formService.searchCivicaStreetNames(
 *   formId,
 *   queryParams,
 * )
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchCivicaStreetNames(
  formId: number,
  queryParams: {
    search?: string
    top?: number
  },
  abortSignal?: AbortSignal,
): Promise<CivicaTypes.CivicaStreetName[]> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/civica/streetregister/streetnames`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get titles codes from Civica name register
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const results = await formService.getCivicaTitleCodes(formId)
 * ```
 *
 * @param formId
 * @param abortSignal
 * @returns
 */
export async function getCivicaTitleCodes(
  formId: number,
  abortSignal?: AbortSignal,
): Promise<FormTypes.ChoiceElementOption[]> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/civica/nameregister/titlecodes`,
      abortSignal,
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get BSB record based on a BSB number codes from Civica name register
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const bsb = '123-321'
 * const results = await formService.getBSBRecord(formId, bsb)
 * ```
 *
 * @param formId
 * @param bsb
 * @param abortSignal
 * @returns
 */
export async function getBSBRecord(
  formId: number,
  bsb: string,
  abortSignal?: AbortSignal,
): Promise<MiscTypes.BSBRecord> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/bsb-records/${bsb}`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'The BSB number you have entered does not exist.',
          {
            originalError: error,
            title: 'Unknown BSB Number',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

const API_NSW_LIQUOR_LICENCE_TOKEN_KEY = 'API_NSW_LIQUOR_LICENCE_TOKEN'
function getAPINSWLiquorLicenceTokenFromStorage() {
  const localStorageValue = localStorage.getItem(
    API_NSW_LIQUOR_LICENCE_TOKEN_KEY,
  )
  if (localStorageValue) {
    try {
      return JSON.parse(
        localStorageValue,
      ) as APINSWTypes.LiquorLicenceAccessTokenResponse
    } catch {
      // ignore JSON parse error
    }
  }
}

async function getAPINSWLiquorLicenceToken(
  formId: number,
  abortSignal?: AbortSignal,
) {
  const liquorLicenceAccessTokenResponse =
    getAPINSWLiquorLicenceTokenFromStorage()
  if (liquorLicenceAccessTokenResponse) {
    const now = new Date()
    const issuedAt = new Date(
      parseInt(liquorLicenceAccessTokenResponse.issued_at),
    )
    const expiresAt = add(issuedAt, {
      seconds: parseInt(liquorLicenceAccessTokenResponse.expires_in),
    })
    if (expiresAt > now) {
      return liquorLicenceAccessTokenResponse
    }
  }

  const result =
    await postRequest<APINSWTypes.LiquorLicenceAccessTokenResponse>(
      `${tenants.current.apiOrigin}/forms/${formId}/api-nsw/liquor/access-token`,
      abortSignal,
    )
  localStorage.setItem(API_NSW_LIQUOR_LICENCE_TOKEN_KEY, JSON.stringify(result))
  return result
}

/**
 * Search for API.NSW Liquor licences based on a partial text search.
 *
 * #### Example
 *
 * ```js
 * const result = await formService.searchAPINSWLiquorLicences({
 *   formId: 1,
 *   search: 'SMITH',
 * })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export async function searchAPINSWLiquorLicences(
  {
    formId,
    searchText,
  }: {
    formId: number
    searchText: string
  },
  abortSignal?: AbortSignal,
): Promise<APINSWTypes.LiquorLicenceBrowseResults> {
  try {
    const apiNSWLiquorLicenceToken = await getAPINSWLiquorLicenceToken(
      formId,
      abortSignal,
    )
    return await fetchJSON<APINSWTypes.LiquorLicenceBrowseResults>(
      `https://api.onegov.nsw.gov.au/liquorregister/v1/browse?searchText=${searchText}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          apikey: apiNSWLiquorLicenceToken.client_id,
          Authorization: `Bearer ${apiNSWLiquorLicenceToken.access_token}`,
        },
        signal: abortSignal,
      },
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

/**
 * Get the details for a single API.NSW Liquor licence based on the licenceID.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const licenceId = '1-RL22KV'
 * const result = await formService.getAPINSWLiquorLicence(
 *   formId,
 *   licenceId,
 * )
 * ```
 *
 * @param formId
 * @param licenceId
 * @param abortSignal
 * @returns
 */
export async function getAPINSWLiquorLicence(
  formId: number,
  licenceId: string,
  abortSignal?: AbortSignal,
): Promise<APINSWTypes.LiquorLicenceDetails> {
  try {
    const apiNSWLiquorLicenceToken = await getAPINSWLiquorLicenceToken(
      formId,
      abortSignal,
    )
    return await fetchJSON<APINSWTypes.LiquorLicenceDetails>(
      `https://api.onegov.nsw.gov.au/liquorregister/v1/details?licenceid=${licenceId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          apikey: apiNSWLiquorLicenceToken.client_id,
          Authorization: `Bearer ${apiNSWLiquorLicenceToken.access_token}`,
        },
        signal: abortSignal,
      },
    )
  } catch (err) {
    throw generateGenericError(err, abortSignal)
  }
}

function generateCPHCMSStorageKey(formId: number) {
  return `CP_HCMS_TOKEN_FORM_${formId}`
}

function getCPHCMSTokenFromStorage(formId: number) {
  const itemKey = generateCPHCMSStorageKey(formId)
  const localStorageValue = localStorage.getItem(itemKey)
  if (localStorageValue) {
    try {
      return JSON.parse(
        localStorageValue,
      ) as CPHCMSTypes.CPHCSMAccessTokenResponse
    } catch {
      // ignore JSON parse error
    }
  }
}

async function getCPHCMSToken(
  { formsAppId, formId }: { formsAppId: number; formId: number },
  abortSignal?: AbortSignal,
) {
  const CPHCMSTokenResponse = getCPHCMSTokenFromStorage(formId)
  if (CPHCMSTokenResponse) {
    const now = new Date()
    const expiresAt = new Date(CPHCMSTokenResponse.auth.expires_at)
    if (expiresAt > now) {
      return CPHCMSTokenResponse
    }
  }

  const result = await postRequest<CPHCMSTypes.CPHCSMAccessTokenResponse>(
    `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms/${formId}/cp-hcms-authentication`,
    abortSignal,
  )
  const itemKey = generateCPHCMSStorageKey(formId)
  localStorage.setItem(itemKey, JSON.stringify(result))
  return result
}

/**
 * Change the status of a CivicPlus HCMS content item to published.
 *
 * @param options
 * @returns
 */
export async function publishHCMSContentItem({
  formsAppId,
  formId,
  contentId,
  abortSignal,
}: {
  formsAppId: number
  formId: number
  contentId: string
  abortSignal?: AbortSignal
}) {
  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms/${formId}/cp-hcms-content/${contentId}/publish`
    return await putRequest(url, undefined, abortSignal)
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Unknown Application',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Change the status of a CivicPlus HCMS content item to draft.
 *
 * @param options
 * @returns
 */
export async function draftHCMSContentItem({
  formsAppId,
  formId,
  contentId,
  abortSignal,
}: {
  formsAppId: number
  formId: number
  contentId: string
  abortSignal?: AbortSignal
}) {
  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms/${formId}/cp-hcms-content/${contentId}/draft`
    return await putRequest(url, undefined, abortSignal)
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Unknown Application',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

export type CivicPlusHCMSContentItemStatus = 'Draft' | 'Published'

export type CivicPlusHCMSContentItem = {
  id: string
  createdBy: string
  lastModifiedBy: string
  data: {
    'submission-json-v1'?: SubmissionTypes.S3SubmissionData & {
      originalExternalId?: string
    }
  }
  /** ISO datetime string */
  created: string
  /** ISO datetime string */
  lastModified: string
  status: CivicPlusHCMSContentItemStatus
  /** HEX colour */
  statusColor: string
  contentTypeName: string
  contentTypeDisplayName: string
  version: number
  contentTypeId: string
}
export type CivicPlusHCMSContentItemsResult = {
  /**
   * Represents the total number of items based on the search. Can be used to
   * achieve paging or infinite scrolling to load more.
   */
  total: number
  /** The HCMS Content Type's items */
  items: CivicPlusHCMSContentItem[]
}

/**
 * Search CivicPlus HCMS content items.
 *
 * @param options
 * @returns
 */
export async function searchCivicPlusHCMSContentItems({
  formsAppId,
  formId,
  $top,
  $skip,
  $search,
  $filter,
  $orderby,
  abortSignal,
}: {
  /** The identifier for the Forms App to determine the HCMS Content Type. */
  formsAppId: number
  /** The identifier for the Form to determine the HCMS Content Type. */
  formId: number
  /**
   * How many items to return in the result. Can be used to achieve paging or
   * infinite scrolling to load more.
   */
  $top?: number
  /**
   * How many items to skip in the result. Can be used to achieve paging or
   * infinite scrolling to load more.
   */
  $skip?: number
  /** Optional OData full text search. */
  $search?: string
  /** Optional OData filter definition. */
  $filter?: string
  /** Optional OData order definition. */
  $orderby?: string
  /** Allows request to be aborted */
  abortSignal?: AbortSignal
}): Promise<CivicPlusHCMSContentItemsResult> {
  try {
    const {
      auth: { access_token },
      appName,
      baseUrl,
      contentTypeName,
    } = await getCPHCMSToken({ formsAppId, formId }, abortSignal)

    const url = new URL(`/api/content/${appName}/${contentTypeName}`, baseUrl)

    if (typeof $top === 'number')
      url.searchParams.append('$top', $top.toString())
    if (typeof $skip === 'number')
      url.searchParams.append('$skip', $skip.toString())
    if ($search) url.searchParams.append('$search', $search)
    if ($filter) url.searchParams.append('$filter', $filter)
    if ($orderby) url.searchParams.append('$orderby', $orderby)
    return await fetchJSON(url.href, {
      signal: abortSignal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        'X-Flatten': 'true',
        'X-Unpublished': 'true',
      },
    })
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Unknown Application',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Delete CivicPlus HCMS content item.
 *
 * @param options
 * @returns
 */
export async function deleteCivicPlusHCMSContentItem({
  formsAppId,
  formId,
  contentId,
  abortSignal,
}: {
  /** The identifier for the Forms App to determine the HCMS Content Type. */
  formsAppId: number
  /** The identifier for the Form to determine the HCMS Content Type. */
  formId: number
  /** The identifier for the HCMS Content to be deleted */
  contentId: string
  /** Allows request to be aborted */
  abortSignal?: AbortSignal
}): Promise<void> {
  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms/${formId}/cp-hcms-content/${contentId}`

    return await deleteRequest(url, abortSignal)
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Unknown Application',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}
