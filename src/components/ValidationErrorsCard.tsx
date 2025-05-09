import { IconButton, Collapse, Tooltip } from '@mui/material'
import * as React from 'react'
import MaterialIcon from './MaterialIcon'
import { FormElementsValidation } from '../types/form'
import useBooleanState from '../hooks/useBooleanState'
import clsx from 'clsx'
import useFormDefinition from '../hooks/useFormDefinition'
import { FormTypes } from '@oneblink/types'
import usePages from '../hooks/usePages'
import ElementDOMId from '../utils/elementDOMIds'
import scrollToElement from '../utils/scrollToElement'
import { Clickable } from './Clickable'

const NO_PAGE_KEY = 'NO_PAGE'
type ValidationErrorMetaData = {
  id: string
  label: string
  page?: {
    label: string
    id: string
  }
  errorMessage: string
}
const getValidationErrors = ({
  formElementsValidation,
  elements,
  page,
  idPrefix,
}: {
  formElementsValidation: FormElementsValidation
  elements: FormTypes.FormElement[]
  page?: ValidationErrorMetaData['page']
  idPrefix: string
}) => {
  return elements.reduce<Array<ValidationErrorMetaData>>((memo, el) => {
    switch (el.type) {
      case 'page': {
        memo.push(
          ...getValidationErrors({
            formElementsValidation,
            elements: el.elements,
            page: el,
            idPrefix,
          }),
        )
        break
      }
      case 'section': {
        memo.push(
          ...getValidationErrors({
            formElementsValidation,
            elements: el.elements,
            page,
            idPrefix,
          }),
        )
        break
      }
      case 'repeatableSet': {
        const validationData = formElementsValidation[el.name]
        if (
          !!validationData &&
          typeof validationData !== 'string' &&
          validationData.type === 'repeatableSet'
        ) {
          const elementDOMId = new ElementDOMId({
            element: el,
            idPrefix,
          })
          if (validationData.set) {
            memo.push({
              id: elementDOMId.elementContainerDOMId,
              errorMessage: validationData.set,
              label: el.label,
              page,
            })
          }
          for (const [key, entry] of Object.entries(validationData.entries)) {
            if (!entry) continue
            memo.push(
              ...getValidationErrors({
                formElementsValidation: entry,
                elements: el.elements,
                page,
                idPrefix: elementDOMId.repeatableSetEntryDOMIdPrefix(key),
              }),
            )
          }
        }
        break
      }
      case 'infoPage':
      case 'form': {
        const validationData = formElementsValidation[el.name]
        if (
          !!validationData &&
          typeof validationData !== 'string' &&
          validationData.type === 'formElements'
        ) {
          if (validationData.formElements && el.elements) {
            const elementDOMId = new ElementDOMId({
              element: el,
              idPrefix,
            })
            memo.push(
              ...getValidationErrors({
                formElementsValidation: validationData.formElements,
                elements: el.elements,
                page,
                idPrefix: elementDOMId.subFormDOMIdPrefix,
              }),
            )
          }
        }
        break
      }
      default: {
        const validationMessage = formElementsValidation[el.name]
        if (typeof validationMessage === 'string') {
          const elementDOMId = new ElementDOMId({
            element: el,
            idPrefix,
          })
          memo.push({
            id: elementDOMId.elementContainerDOMId,
            label: el.label,
            page,
            errorMessage: validationMessage,
          })
        }
      }
    }
    return memo
  }, [])
}

const ValidationErrorsCard = ({
  formElementsValidation,
  currentPage,
  setPageId,
  navigationTopOffset,
  scrollableContainerId,
}: {
  formElementsValidation: FormElementsValidation | undefined
  currentPage: FormTypes.PageElement
  setPageId: ReturnType<typeof usePages>['setPageId']
  navigationTopOffset: number | 'CALCULATE'
  scrollableContainerId?: string
}) => {
  const [isExpanded, expand, contract] = useBooleanState(false)

  const form = useFormDefinition()

  const pagesWithValidationErrors = React.useMemo(() => {
    if (!formElementsValidation) return []
    const flatErrors = getValidationErrors({
      formElementsValidation,
      elements: form.elements,
      idPrefix: '',
    })

    // Organise into pages
    const pages = new Map<
      string,
      {
        page: ValidationErrorMetaData['page']
        errors: ValidationErrorMetaData[]
      }
    >()
    for (const error of flatErrors) {
      if (error.page) {
        // If error belongs to a page
        const existingSetEntry = pages.get(error.page.id)
        const errors = [...(existingSetEntry?.errors || []), error]
        const page = error.page

        pages.set(page.id, {
          page,
          errors,
        })
      } else {
        // No page associated with error
        const existingSetEntry = pages.get(NO_PAGE_KEY)
        const errors = [...(existingSetEntry?.errors || []), error]
        pages.set(NO_PAGE_KEY, {
          page: undefined,
          errors,
        })
      }
    }
    return Array.from(pages.values())
  }, [form.elements, formElementsValidation])

  return (
    <div className="ob-validation-notification-wrapper">
      <div
        className={clsx(
          'ob-validation-notification-card cypress-invalid-submit-attempt',
          {
            'is-clickable': !isExpanded,
            'is-contracted': !isExpanded,
            'is-expanded': isExpanded,
          },
        )}
        onClick={!isExpanded ? expand : undefined}
      >
        <div className="ob-validation-notification-card-content">
          <div className="ob-validation-notification-card-header-wrapper">
            <div className="ob-validation-notification-card-header-title-wrapper">
              <MaterialIcon
                className={clsx(
                  'ob-validation-notification-card-header-title-icon ob-validation-color-transition',
                  {
                    'has-text-danger': isExpanded,
                    'has-text-white': !isExpanded,
                  },
                )}
              >
                error
              </MaterialIcon>
              <p
                className={clsx(
                  'ob-validation-color-transition ob-validation-notification-card-header-title-text',
                  {
                    'has-text-danger': isExpanded,
                    'has-text-white': !isExpanded,
                  },
                )}
              >
                Validation Errors
              </p>
            </div>
            <div className="ob-validation-notification-card-header-collapse-icon-wrapper">
              {isExpanded ? (
                <IconButton onClick={contract}>
                  <MaterialIcon className="icon-small">
                    expand_more
                  </MaterialIcon>
                </IconButton>
              ) : (
                <IconButton>
                  <MaterialIcon className="icon-small has-text-white">
                    expand_less
                  </MaterialIcon>
                </IconButton>
              )}
            </div>
          </div>
          <div className="ob-validation-notification-card-collapse-wrapper">
            <Collapse in={isExpanded}>
              {pagesWithValidationErrors.map(({ page, errors }, pageIndex) => {
                const isNotFirstPage = pageIndex > 0
                return (
                  <React.Fragment key={pageIndex}>
                    {page && (
                      <p
                        className={clsx(
                          'ob-validation-notification-card-page-label ob-validation-color-transition',
                          {
                            'is-not-first': isNotFirstPage,
                          },
                        )}
                      >
                        {page.label}
                      </p>
                    )}
                    <div className="ob-list has-dividers has-borders ob-validation-notification-card-list ob-validation-color-transition">
                      {errors.map(
                        ({ errorMessage, label, id }, index, list) => {
                          const isFirst = index === 0
                          const isLast = index === list.length - 1
                          return (
                            <Clickable
                              key={index}
                              className={clsx(
                                'ob-list__item is-clickable ob-validation-notification-card-item',
                                {
                                  'is-first': isFirst,
                                  'is-last': isLast,
                                },
                              )}
                              onClick={() => {
                                if (page && page.id !== currentPage.id) {
                                  setPageId(page.id)
                                }

                                scrollToElement({
                                  id,
                                  navigationTopOffset,
                                  scrollableContainerId,
                                })
                              }}
                            >
                              <div className="ob-validation-notification-card-item-text">
                                <p>{label}</p>
                                <Tooltip
                                  title={errorMessage}
                                  placement="left"
                                  arrow
                                >
                                  <p className="ob-validation-notification-card-item-text-error-message has-text-danger">
                                    {errorMessage}
                                  </p>
                                </Tooltip>
                              </div>
                              <MaterialIcon className="has-text-grey icon-small ob-validation-notification-card-item-icon">
                                chevron_right
                              </MaterialIcon>
                            </Clickable>
                          )
                        },
                      )}
                    </div>
                  </React.Fragment>
                )
              })}
            </Collapse>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ValidationErrorsCard)
