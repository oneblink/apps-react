import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Collapse,
  styled,
} from '@mui/material'
import * as React from 'react'
import MaterialIcon from './MaterialIcon'
import { FormElementsValidation } from '../types/form'
import useBooleanState from '../hooks/useBooleanState'
import clsx from 'clsx'
import useFormDefinition from '../hooks/useFormDefinition'
import { FormTypes } from '@oneblink/types'

const NO_PAGE_KEY = 'NO_PAGE'
// const transitionLength = 3000
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
          for (const [key, entry] of Object.entries(validationData.entries)) {
            if (!entry) continue
            memo.push(
              ...getValidationErrors({
                formElementsValidation: entry,
                elements: el.elements,
                page,
                idPrefix: `${idPrefix}${el.name}_entry-${key}_`,
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
          validationData.formElements

          if (validationData.formElements && el.elements) {
            memo.push(
              ...getValidationErrors({
                formElementsValidation: validationData.formElements,
                elements: el.elements,
                page,
                idPrefix: `${idPrefix}${el.name}_`,
              }),
            )
          }
        }
        break
      }
      default: {
        const validationMessage = formElementsValidation[el.name]
        if (typeof validationMessage === 'string') {
          memo.push({
            id: `${idPrefix}${el.name}`,
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

const PulsingCard = styled(Card)<{ isExpanded: boolean }>(() => {
  return {
    animation: 'pulse-animation 1.5s infinite',
    '@keyframes pulse-animation': {
      '0%': {
        boxShadow: '0 0 0 0px rgba(255, 0, 0, 0.4)',
      },
      '99%': {
        boxShadow: '0 0 0 16px rgba(255, 0, 0, 0.0)',
      },
    },
  }
})
const ValidationErrorsCard = ({
  formElementsValidation,
  display,
  currentPage,
  setPageId,
}: {
  formElementsValidation: FormElementsValidation | undefined
  display: boolean
  currentPage: FormTypes.PageElement
  setPageId: (pageId: string) => void
}) => {
  const [isExpanded, expand, contract] = useBooleanState(true)

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
  if (!display) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 10,
      }}
    >
      <PulsingCard
        isExpanded={isExpanded}
        elevation={!isExpanded ? 20 : 0}
        sx={(theme) => ({
          transition: `${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          maxHeight: 350,
          overflowY: 'auto',
          borderColor: theme.palette.error.light,
          borderWidth: 2,
          borderStyle: 'solid',
          backgroundColor: !isExpanded ? theme.palette.error.light : undefined,
          color: !isExpanded ? theme.palette.error.contrastText : undefined,
        })}
        className={!isExpanded ? 'is-clickable' : ''}
        onClick={!isExpanded ? expand : undefined}
      >
        <CardContent
          sx={(theme) => ({
            transition: `${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
            paddingBottom: !isExpanded ? `8px !important` : undefined,
            paddingTop: !isExpanded ? `8px !important` : undefined,
          })}
        >
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item alignItems="center" display="flex">
              <MaterialIcon
                className={clsx({
                  'has-text-danger': isExpanded,
                  'has-text-white': !isExpanded,
                })}
                sx={{ mr: 1, fontSize: 22 }}
              >
                error
              </MaterialIcon>
              <Typography
                className={clsx({
                  'has-text-danger': isExpanded,
                  'has-text-white': !isExpanded,
                })}
                fontWeight={600}
              >
                Validation Errors
              </Typography>
            </Grid>
            <Grid item>
              {isExpanded ? (
                <IconButton onClick={contract}>
                  <MaterialIcon className="icon-small">
                    expand_more
                  </MaterialIcon>
                </IconButton>
              ) : (
                <IconButton onClick={expand}>
                  <MaterialIcon className="icon-small has-text-white">
                    expand_less
                  </MaterialIcon>
                </IconButton>
              )}
            </Grid>
          </Grid>
          <Box
            sx={(theme) => ({
              transition: `width ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
              whiteSpace: 'nowrap',
              width: isExpanded ? 300 : 194,
              overflowX: 'hidden',
              opacity: isExpanded ? 1 : 0,
            })}
          >
            <Collapse in={isExpanded}>
              {pagesWithValidationErrors.map(({ page, errors }, pageIndex) => {
                const isNotFirstPage = pageIndex > 0
                return (
                  <>
                    {isNotFirstPage && <Box mt={1} />}
                    {page && (
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="text.primary"
                      >
                        {page.label}
                      </Typography>
                    )}
                    <Box mb={1} />
                    {errors.map(({ errorMessage, label, id }, index, list) => {
                      const isFirst = index === 0
                      const isLast = index === list.length - 1
                      return (
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          key={index}
                          p={1}
                          sx={(theme) => ({
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderTopLeftRadius: isFirst ? 8 : 0,
                            borderTopRightRadius: isFirst ? 8 : 0,
                            borderBottomWidth: isLast ? 1 : 0,
                            borderBottomLeftRadius: isLast ? 8 : 0,
                            borderBottomRightRadius: isLast ? 8 : 0,
                          })}
                          className="ob-list__item is-clickable"
                          onClick={() => {
                            if (page && page.id !== currentPage.id) {
                              setPageId(page.id)
                            }
                            const element = document.getElementById(id)
                            if (element) {
                              window.requestAnimationFrame(() => {
                                element.scrollIntoView({
                                  behavior: 'smooth',
                                })
                              })
                            }
                          }}
                        >
                          <Box sx={{ whitespace: 'nowrap' }}>
                            <Typography variant="body2" color="text.primary">
                              {label}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="has-text-danger"
                              sx={{
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {errorMessage}
                            </Typography>
                          </Box>
                          <MaterialIcon
                            className="has-text-grey icon-small"
                            sx={{ ml: 1 }}
                          >
                            chevron_right
                          </MaterialIcon>
                        </Box>
                      )
                    })}
                  </>
                )
              })}
            </Collapse>
          </Box>
        </CardContent>
      </PulsingCard>
    </Box>
  )
}

export default React.memo(ValidationErrorsCard)
