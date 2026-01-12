import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import { EnvironmentTypes, FormTypes, FreshdeskTypes } from '@oneblink/types'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { isLoggedIn } from './services/cognito'
import {
  fetchWithError,
  generateHeaders,
  HTTPError,
  searchRequest,
  getRequest,
} from './services/fetch'
import tenants from './tenants'

import Sentry from './Sentry'
export * from './services/integration-elements'

/**
 * Get an array of OneBlink Forms.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const forms = await formService.getForms(formAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
async function getForms(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormTypes.Form[]> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return searchRequest<{ forms: FormTypes.Form[] }>(
    url,
    {
      injectForms: true,
    },
    abortSignal,
  )
    .then(({ forms }) => forms)
    .catch((error) => {
      Sentry.captureException(error)
      console.error('Error retrieving forms', error)

      if (isOffline()) {
        throw new OneBlinkAppsError(
          'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
          {
            originalError: error,
            isOffline: true,
          },
        )
      }
      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            'The application you are attempting to view requires authentication. Please login and try again.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.status,
            },
          )
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
            'We could not find the application you are looking for. Please contact your administrator to ensure the application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              requiresAccessRequest: true,
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
    })
}

/**
 * Get a OneBlink Form by id or slug.
 *
 * #### Example
 *
 * ```js
 * const form = await formService.getForm({
 *   formId: 1,
 *   formAppId: 1, // `formsAppId` is optional
 *   formsAppEnvironmentId: undefined,
 *   formSlug: undefined,
 *   toCompleteTask: false,
 * })
 *
 * // OR
 *
 * const form = await formService.getForm({
 *   formSlug: 'audit',
 *   formAppId: 1,
 *   formsAppEnvironmentId: undefined,
 *   formId: undefined,
 *   toCompleteTask: false,
 * })
 *
 * // OR
 *
 * const form = await formService.getForm({
 *   formSlug: 'audit',
 *   formsAppEnvironmentId: 1,
 *   formAppId: undefined,
 *   formId: undefined,
 *   toCompleteTask: false,
 * })
 * ```
 *
 * @param options
 * @returns
 */
async function getForm({
  formsAppId,
  formsAppEnvironmentId,
  abortSignal,
  formSlug,
  toCompleteTask,
  formId,
}: {
  formSlug: string | undefined
  formId: number | undefined
  formsAppId: number | undefined
  formsAppEnvironmentId: number | undefined
  toCompleteTask?: boolean
  abortSignal?: AbortSignal
}): Promise<FormTypes.Form> {
  return (
    (() => {
      const queryParams = {
        toCompleteTask,
      }
      if (formSlug) {
        if (!Number.isNaN(formsAppEnvironmentId)) {
          return searchRequest<FormTypes.Form>(
            `${tenants.current.apiOrigin}/forms-app-environments/${formsAppEnvironmentId}/forms/${formSlug}`,
            queryParams,
            abortSignal,
          )
        }

        if (!Number.isNaN(formsAppId)) {
          return searchRequest<FormTypes.Form>(
            `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms/${formSlug}`,
            queryParams,
            abortSignal,
          )
        }
      }

      return searchRequest<FormTypes.Form>(
        `${tenants.current.apiOrigin}/form-definitions/${formId}`,
        queryParams,
        abortSignal,
      )
    })()
      // If we could not find a form by Id for any reason,
      // we will try and get it from cache from the all forms endpoint
      .catch((error) => {
        if (typeof formsAppId !== 'number' || Number.isNaN(formsAppId)) {
          throw error
        }

        return getForms(formsAppId, abortSignal)
          .catch(() => {
            // Ignore getForms() error and throw the error from attempt to get form by id
            throw error
          })
          .then((forms) => {
            const form = forms.find(
              (form) =>
                form.id === formId || (formSlug && form.slug === formSlug),
            )
            if (form) {
              return form
            }
            throw error
          })
      })
      .catch((error) => {
        Sentry.captureException(error)
        console.warn(
          'Error retrieving form from API',
          {
            formsAppId,
            formsAppEnvironmentId,
            formSlug,
            formId,
          },
          error,
        )
        if (isOffline()) {
          throw new OneBlinkAppsError(
            'You are currently offline and do not have a local copy of this form available, please connect to the internet and try again',
            {
              originalError: error,
              isOffline: true,
            },
          )
        }

        switch (error.status) {
          case 401: {
            throw new OneBlinkAppsError(
              'The form you are attempting to complete requires authentication. Please login and try again.',
              {
                originalError: error,
                requiresLogin: true,
                httpStatusCode: error.status,
              },
            )
          }
          case 403: {
            throw new OneBlinkAppsError(
              'You do not have access to complete this form. Please contact your administrator to gain the correct level of access.',
              {
                originalError: error,
                requiresAccessRequest: true,
                httpStatusCode: error.status,
              },
            )
          }
          case 400:
          case 404: {
            let message =
              'We could not find the form you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.'
            const requiresLogin = !isLoggedIn()
            if (requiresLogin) {
              message +=
                ' Try logging in if you believe this form requires authentication.'
            }
            throw new OneBlinkAppsError(message, {
              originalError: error,
              title: 'Unknown Form',
              httpStatusCode: error.status,
              requiresLogin,
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
      })
  )
}

type FormElementLookupResult = FormTypes.FormElementLookup & {
  url: string | null
  records: FormTypes.FormElementLookupStaticDataRecord[] | null
  runLookupOnClear: boolean
}

/**
 * Get an array of OneBlink Form Element Lookups.
 *
 * #### Example
 *
 * ```js
 * const organisationId = '1234567890ABCDEFG'
 * const formsAppEnvironmentId = 1
 * const formElementLookups = await formService.getFormElementLookups(
 *   organisationId,
 *   formsAppEnvironmentId,
 * )
 * ```
 *
 * @param organisationId
 * @param formsAppEnvironmentId
 * @param abortSignal
 * @returns
 */
async function getFormElementLookups(
  organisationId: string,
  formsAppEnvironmentId: number,
  abortSignal?: AbortSignal,
): Promise<FormElementLookupResult[]> {
  try {
    const data = await searchRequest<{
      formElementLookups: FormTypes.FormElementLookup[]
    }>(
      `${tenants.current.apiOrigin}/form-element-lookups`,
      {
        organisationId,
      },
      abortSignal,
    )
    return data.formElementLookups.map((formElementLookup) => ({
      ...formElementLookup,
      url: getFormElementLookupUrl(formElementLookup, formsAppEnvironmentId),
      records: getFormElementLookupRecords(
        formElementLookup,
        formsAppEnvironmentId,
      ),
      runLookupOnClear: getFormElementLookupRunLookupOnClear(
        formElementLookup,
        formsAppEnvironmentId,
      ),
    }))
  } catch (error) {
    Sentry.captureException(error)
    console.warn(
      `Error retrieving form element lookups for organisationId ${organisationId}`,
      error,
    )
    throw error
  }
}
function getFormElementLookupUrl(
  formElementLookup: FormTypes.FormElementLookup,
  formsAppEnvironmentId: number,
) {
  if (formElementLookup.type === 'STATIC_DATA') {
    return null
  }

  return formElementLookup.environments.reduce<string | null>(
    (url, formElementLookupEnvironment) => {
      if (
        !url &&
        formElementLookupEnvironment.formsAppEnvironmentId ===
          formsAppEnvironmentId
      ) {
        return formElementLookupEnvironment.url
      }
      return url
    },
    null,
  )
}
function getFormElementLookupRecords(
  formElementLookup: FormTypes.FormElementLookup,
  formsAppEnvironmentId: number,
) {
  if (formElementLookup.type !== 'STATIC_DATA') {
    return null
  }

  return formElementLookup.environments.reduce<
    FormTypes.FormElementLookupStaticDataRecord[] | null
  >((records, formElementLookupEnvironment) => {
    if (
      !records &&
      formElementLookupEnvironment.formsAppEnvironmentId ===
        formsAppEnvironmentId
    ) {
      return formElementLookupEnvironment.records
    }
    return records
  }, null)
}
function getFormElementLookupRunLookupOnClear(
  formElementLookup: FormTypes.FormElementLookup,
  formsAppEnvironmentId: number,
) {
  if (formElementLookup.type === 'STATIC_DATA') {
    return formElementLookup.environments.some(
      (formElementLookupEnvironment) => {
        return (
          formElementLookupEnvironment.formsAppEnvironmentId ===
            formsAppEnvironmentId &&
          formElementLookupEnvironment.records.some((record) => {
            return record.inputType === 'UNDEFINED'
          })
        )
      },
    )
  }

  return formElementLookup.environments.some((formElementLookupEnvironment) => {
    return (
      formElementLookupEnvironment.formsAppEnvironmentId ===
        formsAppEnvironmentId && formElementLookupEnvironment.runLookupOnClear
    )
  })
}

/**
 * Get a OneBlink Form Element Lookup.
 *
 * #### Example
 *
 * ```js
 * const organisationId = '1234567890ABCDEFG'
 * const formsAppEnvironmentId = 1
 * const formElementLookupId = 1
 * const formElementLookup = await formService.getFormElementLookupById(
 *   organisationId,
 *   formsAppEnvironmentId,
 *   formElementLookupId,
 * )
 * if (formElementLookup) {
 *   // Use lookup
 * }
 * ```
 *
 * @param organisationId
 * @param formsAppEnvironmentId
 * @param formElementLookupId
 * @param abortSignal
 * @returns
 */
async function getFormElementLookupById(
  organisationId: string,
  formsAppEnvironmentId: number,
  formElementLookupId: number,
  abortSignal?: AbortSignal,
): Promise<FormElementLookupResult | undefined> {
  return getFormElementLookups(
    organisationId,
    formsAppEnvironmentId,
    abortSignal,
  ).then((formElementLookups) =>
    formElementLookups.find(
      (formElementLookup) => formElementLookup.id === formElementLookupId,
    ),
  )
}

/**
 * Get a list of options sets for an organisation.
 *
 * @param organisationId The identifier for the organisation to fetch options
 *   sets for
 * @param abortSignal A signal to abort any asynchronous processing
 * @returns An array of options sets
 */
async function getFormElementOptionsSets(
  organisationId: string,
  abortSignal: AbortSignal,
): Promise<Array<FormTypes.FormElementOptionSet>> {
  const { formElementDynamicOptionSets } = await searchRequest<{
    formElementDynamicOptionSets: Array<FormTypes.FormElementOptionSet>
  }>(
    `${tenants.current.apiOrigin}/form-element-options/dynamic`,
    {
      organisationId,
    },
    abortSignal,
  )
  return formElementDynamicOptionSets
}

type FormElementOptionsSetResult =
  | {
      type: 'OPTIONS'
      options: unknown
    }
  | {
      type: 'SEARCH'
      url: string
      searchQuerystringParameter: string
    }
  | {
      type: 'ERROR'
      error: OneBlinkAppsError
    }

/**
 * Get the options for an options set.
 *
 * @param formElementOptionsSet The form element options set to generate options
 *   from
 * @param options The environment and form to pull options from
 * @param abortSignal A signal to abort any asynchronous processing
 * @returns A result object containing potential options or a predictable error
 */
async function getFormElementOptionsSetOptions(
  formElementOptionsSet: FormTypes.FormElementOptionSet,
  {
    formsAppEnvironmentId,
    formId,
  }: {
    formsAppEnvironmentId: number
    formId: number
  },
  abortSignal: AbortSignal,
): Promise<FormElementOptionsSetResult> {
  switch (formElementOptionsSet.type) {
    case 'HCMS_CATEGORIES':
    case 'STATIC': {
      const formElementOptionsSetEnvironment =
        formElementOptionsSet.environments.find(
          (environment: FormTypes.FormElementOptionSetEnvironmentStatic) =>
            environment.formsAppEnvironmentId === formsAppEnvironmentId,
        )
      if (formElementOptionsSetEnvironment) {
        return {
          type: 'OPTIONS',
          options: formElementOptionsSetEnvironment.options,
        }
      }
      return {
        type: 'ERROR',
        error: new OneBlinkAppsError(
          `List environment configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
          {
            title: 'Misconfigured List',
            originalError: new Error(
              JSON.stringify(
                {
                  formElementOptionsSetId: formElementOptionsSet.id,
                  formElementOptionsSetName: formElementOptionsSet.name,
                  formsAppEnvironmentId,
                },
                null,
                2,
              ),
            ),
          },
        ),
      }
    }
    case 'SHAREPOINT_LIST_COLUMN': {
      const formElementOptionSetEnvironmentSharePointListColumn =
        formElementOptionsSet.environments.find(
          (environment) =>
            environment.formsAppEnvironmentId === formsAppEnvironmentId,
        )
      if (!formElementOptionSetEnvironmentSharePointListColumn) {
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Dynamic list configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
            {
              title: 'Misconfigured Dynamic List',
              originalError: new Error(
                JSON.stringify(
                  {
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    formsAppEnvironmentId,
                  },
                  null,
                  2,
                ),
              ),
            },
          ),
        }
      }

      try {
        const { options } = await getRequest<{ options: unknown }>(
          `${tenants.current.apiOrigin}/forms/${formId}/sharepoint-list-column-options?formElementOptionsSetId=${formElementOptionsSet.id}`,
          abortSignal,
        )
        return {
          type: 'OPTIONS',
          options,
        }
      } catch (error) {
        Sentry.captureException(error)
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Options could not be loaded. Please contact your administrator to rectify the issue.`,
            {
              title: 'Invalid List Response',
              httpStatusCode: (error as HTTPError).status,
              originalError: new OneBlinkAppsError(
                JSON.stringify(
                  {
                    formsAppEnvironmentId,
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    sharepointSite:
                      formElementOptionSetEnvironmentSharePointListColumn
                        .sharepointSite.displayName,
                    sharepointList:
                      formElementOptionSetEnvironmentSharePointListColumn
                        .sharepointList.displayName,
                    sharepointColumn:
                      formElementOptionSetEnvironmentSharePointListColumn
                        .sharepointColumn.displayName,
                  },
                  null,
                  2,
                ),
                {
                  originalError: error as HTTPError,
                },
              ),
            },
          ),
        }
      }
    }
    case 'GOOD_TO_GO_CUSTOM_FIELD': {
      const formElementOptionSetEnvironmentGoodToGoCustomField =
        formElementOptionsSet.environments.find(
          (environment) =>
            environment.formsAppEnvironmentId === formsAppEnvironmentId,
        )
      if (!formElementOptionSetEnvironmentGoodToGoCustomField) {
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Dynamic list configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
            {
              title: 'Misconfigured Dynamic List',
              originalError: new Error(
                JSON.stringify(
                  {
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    formsAppEnvironmentId,
                  },
                  null,
                  2,
                ),
              ),
            },
          ),
        }
      }

      try {
        const { options } = await getRequest<{ options: unknown }>(
          `${tenants.current.apiOrigin}/forms/${formId}/good-to-go-custom-field-options?formElementOptionsSetId=${formElementOptionsSet.id}`,
          abortSignal,
        )
        return {
          type: 'OPTIONS',
          options,
        }
      } catch (error) {
        Sentry.captureException(error)
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Options could not be loaded. Please contact your administrator to rectify the issue.`,
            {
              title: 'Invalid List Response',
              httpStatusCode: (error as HTTPError).status,
              originalError: new OneBlinkAppsError(
                JSON.stringify(
                  {
                    formsAppEnvironmentId,
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    goodToGoCustomField:
                      formElementOptionSetEnvironmentGoodToGoCustomField
                        .goodToGoCustomField.displayName,
                  },
                  null,
                  2,
                ),
                {
                  originalError: error as HTTPError,
                },
              ),
            },
          ),
        }
      }
    }
    case 'HOSTED_API':
    case 'URL':
    default: {
      const formElementOptionsSetEnvironment =
        formElementOptionsSet.environments.find(
          (environment: FormTypes.FormElementOptionSetEnvironmentUrl) =>
            environment.formsAppEnvironmentId === formsAppEnvironmentId,
        )
      if (!formElementOptionsSetEnvironment) {
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Dynamic list configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
            {
              title: 'Misconfigured Dynamic List',
              originalError: new Error(
                JSON.stringify(
                  {
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    formsAppEnvironmentId,
                  },
                  null,
                  2,
                ),
              ),
            },
          ),
        }
      }

      if (formElementOptionsSetEnvironment.searchQuerystringParameter) {
        return {
          type: 'SEARCH',
          url: formElementOptionsSetEnvironment.url,
          searchQuerystringParameter:
            formElementOptionsSetEnvironment.searchQuerystringParameter,
        }
      }

      try {
        const headers = await generateHeaders()
        const response = await fetchWithError(
          formElementOptionsSetEnvironment.url,
          {
            headers,
            signal: abortSignal,
          },
        )

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text)
        }

        const options = await response.json()
        return {
          type: 'OPTIONS',
          options,
        }
      } catch (error) {
        Sentry.captureException(error)
        return {
          type: 'ERROR',
          error: new OneBlinkAppsError(
            `Options could not be loaded. Please contact your administrator to rectify the issue.`,
            {
              title: 'Invalid List Response',
              httpStatusCode: (error as HTTPError).status,
              originalError: new OneBlinkAppsError(
                JSON.stringify(
                  {
                    formElementOptionsSetId: formElementOptionsSet.id,
                    formElementOptionsSetName: formElementOptionsSet.name,
                    formElementOptionsSetUrl:
                      formElementOptionsSetEnvironment.url,
                    formsAppEnvironmentId,
                  },
                  null,
                  2,
                ),
                {
                  originalError: error as HTTPError,
                },
              ),
            },
          ),
        }
      }
    }
  }
}

/**
 * @param form The form definition the form element is in. Used to generate
 *   conditional logic for the
 * @param element The form element to have options appended to
 * @param data The untrusted options that need to be parsed.
 * @returns A new form element. The element passed in is not mutated.
 */
function parseFormElementOptions(
  form: FormTypes.Form,
  element: FormTypes.FormElementWithOptions,
  options: unknown,
): FormTypes.FormElementWithOptions {
  const dynamicOptions =
    formElementsService.parseDynamicFormElementOptions(options)
  const conditionallyShowOptionsElementIds: string[] = []
  const formElementOptions = dynamicOptions.map<FormTypes.ChoiceElementOption>(
    (option) => {
      const optionsMap = (option.attributes || []).reduce<
        Record<string, FormTypes.ChoiceElementOptionAttribute>
      >((memo, { label, value }) => {
        if (
          !element.attributesMapping ||
          !Array.isArray(element.attributesMapping)
        ) {
          return memo
        }
        const attribute = element.attributesMapping.find(
          (map) => map.attribute === label,
        )
        if (!attribute) return memo

        const elementId = attribute.elementId
        const predicateElement = formElementsService.findFormElement(
          form.elements,
          (el) => el.id === elementId,
        )
        if (!predicateElement) {
          return memo
        }

        const predicateElementWithOptions =
          typeCastService.formElements.toOptionsElement(predicateElement)
        if (!predicateElementWithOptions) {
          return memo
        }

        const predicateOption = predicateElementWithOptions.options?.find(
          (option) => option.value === value,
        )
        memo[elementId] = memo[elementId] || {
          elementId,
          optionIds: [],
        }
        memo[elementId].optionIds.push(
          predicateOption?.id || predicateOption?.value || value,
        )

        conditionallyShowOptionsElementIds.push(elementId)
        return memo
      }, {})

      return {
        ...option,
        id: option.value,
        attributes: Object.keys(optionsMap).map((key) => optionsMap[key]),
      }
    },
  )

  return {
    ...element,
    options: formElementOptions,
    conditionallyShowOptionsElementIds,
  }
}

/**
 * Load the options for Form Elements that are using a OneBlink List. Useful to
 * cache all the dynamic options when first opening an application.
 *
 * @param forms
 * @param abortSignal
 * @returns
 */
async function loadFormElementDynamicOptions(
  forms: FormTypes.Form[],
  abortSignal: AbortSignal,
): Promise<void> {
  await Promise.all([
    (async () => {
      const formWithFreshdeskFields = forms.find((form) => {
        return formElementsService.findFormElement(form.elements, (el) => {
          const formElementWithOptions =
            typeCastService.formElements.toOptionsElement(el)
          return (
            formElementWithOptions?.optionsType === 'FRESHDESK_FIELD' &&
            !!formElementWithOptions.freshdeskFieldName
          )
        })
      }, [])
      if (formWithFreshdeskFields) {
        await getFreshdeskFields(formWithFreshdeskFields.id, abortSignal)
      }
    })(),
    (async () => {
      // Get the lists id for each element
      const formElementOptionsSetIds = forms.reduce((ids: number[], form) => {
        formElementsService.forEachFormElementWithOptions(
          form.elements,
          (el) => {
            if (
              el.optionsType === 'DYNAMIC' &&
              typeof el.dynamicOptionSetId === 'number'
            ) {
              ids.push(el.dynamicOptionSetId)
            }
          },
        )
        return ids
      }, [])

      if (!formElementOptionsSetIds.length) {
        return
      }

      // Get the lists for all the ids
      const organisationId = forms[0].organisationId
      const allFormElementOptionsSets = await getFormElementOptionsSets(
        organisationId,
        abortSignal,
      )

      const formElementOptionsSets = allFormElementOptionsSets.filter(
        ({ id }) => formElementOptionsSetIds.includes(id || 0),
      )

      // Get the options for all the lists
      await Promise.all(
        formElementOptionsSets.map(async (formElementOptionsSet) => {
          await getFormElementOptionsSetOptions(
            formElementOptionsSet,
            {
              formsAppEnvironmentId: forms[0].formsAppEnvironmentId,
              formId: forms[0].id,
            },
            abortSignal,
          )
        }),
      )
    })(),
    (async () => {
      //Check if there are any forms with a lookup
      const isThereAFormWithLookup = forms.some((form) => {
        const element = formElementsService.findFormElement(
          form.elements,
          (el) => {
            const lookupElement =
              typeCastService.formElements.toLookupElement(el)
            if (lookupElement) {
              if (lookupElement.isDataLookup || lookupElement.isElementLookup) {
                return true
              }
            }
            return false
          },
        )
        return !!element
      })

      if (!isThereAFormWithLookup) {
        return
      }

      //Obtain all lookups
      const organisationId = forms[0].organisationId
      const formsAppEnvironmentId = forms[0].formsAppEnvironmentId
      await getFormElementLookups(
        organisationId,
        formsAppEnvironmentId,
        abortSignal,
      )
    })(),
  ])
}

/**
 * Get the Freshdesk Fields associated with a form
 *
 * @param formId The identifier for the form to fetch freshdesk fields for
 * @param abortSignal A signal to abort any asynchronous processing
 * @returns An array of Freshdesk Fields
 */
async function getFreshdeskFields(
  formId: number,
  abortSignal: AbortSignal,
): Promise<FreshdeskTypes.FreshdeskField[]> {
  return await getRequest<FreshdeskTypes.FreshdeskField[]>(
    `${tenants.current.apiOrigin}/forms/${formId}/freshdesk-fields`,
    abortSignal,
  )
}

/**
 * Parse Freshdesk Field options associated with a form element as form element
 * options.
 *
 * @param freshdeskFields An array of Freshdesk Fields
 * @param element The element to array of Freshdesk Fields
 * @returns An object containing valid options or a predictable error
 */
function parseFreshdeskFieldOptions(
  freshdeskFields: FreshdeskTypes.FreshdeskField[],
  element: FormTypes.FormElementWithOptions,
):
  | {
      type: 'OPTIONS'
      options: FormTypes.ChoiceElementOption[]
    }
  | {
      type: 'ERROR'
      error: OneBlinkAppsError
    } {
  const freshdeskField = freshdeskFields.find(
    (freshdeskField) => element.freshdeskFieldName === freshdeskField.name,
  )
  if (!freshdeskField) {
    return {
      type: 'ERROR',
      error: new OneBlinkAppsError(
        `Freshdesk Field does not exist. Please contact your administrator to rectify the issue.`,
        {
          title: 'Missing Freshdesk Field',
          originalError: new Error(JSON.stringify(element, null, 2)),
        },
      ),
    }
  }
  const options = freshdeskField.options
  if (!Array.isArray(options)) {
    return {
      type: 'ERROR',
      error: new OneBlinkAppsError(
        `Freshdesk Field does not have options. Please contact your administrator to rectify the issue.`,
        {
          title: 'Invalid Freshdesk Field',
          originalError: new Error(
            JSON.stringify({ element, freshdeskField }, null, 2),
          ),
        },
      ),
    }
  }

  return {
    type: 'OPTIONS',
    options: mapNestedOptions(options) || [],
  }
}

const mapNestedOptions = (
  options: FreshdeskTypes.FreshdeskFieldOption[] | undefined,
): FormTypes.ChoiceElementOption[] | undefined => {
  return options?.map<FormTypes.ChoiceElementOption>(
    ({ value, label, options: nestedOptions }) => ({
      id: value.toString(),
      value: value.toString(),
      label,
      options: mapNestedOptions(
        nestedOptions,
      ) as FormTypes.DynamicChoiceElementOption[],
    }),
  )
}

/**
 * Get configuration for a OneBlink Form.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const configuration = await formService.getFormConfiguration(formId)
 * ```
 *
 * @param formId
 * @param abortSignal
 * @returns
 */
async function getFormConfiguration(
  formId: number,
  abortSignal?: AbortSignal,
): Promise<EnvironmentTypes.FormsAppEnvironmentConfiguration> {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/configuration`

  try {
    return await getRequest<EnvironmentTypes.FormsAppEnvironmentConfiguration>(
      url,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this form available, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }

    switch (error.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the form you are looking for. Please contact support if the problem persists.',
          {
            originalError: error,
            title: 'Unknown Form',
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

export {
  FormElementOptionsSetResult,
  getForms,
  getForm,
  FormElementLookupResult,
  getFormElementLookups,
  getFormElementLookupById,
  getFormElementOptionsSets,
  getFormElementOptionsSetOptions,
  parseFormElementOptions,
  getFreshdeskFields,
  parseFreshdeskFieldOptions,
  loadFormElementDynamicOptions,
  getFormConfiguration,
}
