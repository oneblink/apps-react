import { StylingEngineTypes } from '@oneblink/types'
import {
  objectEntriesAsKeyValuePairs,
  cssMappingsNeverKeyLog as neverKey,
  CssMappings,
} from '../services/styling-engine'
import useApplyUserDefinedStyling from './useApplyUserDefinedStyling'

const cssKeys = {
  borderColour: 'border-color',
  borderRadius: 'border-radius',
  borderWidth: 'border-width',
  padding: 'padding',
  fontColor: 'color',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  backgroundColour: 'background-color',
  marginBottom: 'margin-bottom',
} as const

const stylingTargets = {
  '.forms-renderer': {},
  '.ob-form-container': {},
  '.ob-element:not(:last-child)': {},
  '.ob-label': {},
  '.ob-heading': {},
  '.title.is-1': {},
  '.title.is-2': {},
  '.title.is-3': {},
  '.title.is-4': {},
  '.title.is-5': {},
} as const

type HeadingSizeKey = 1 | 2 | 3 | 4 | 5

const useApplyUserDefinedFormStyling = (
  formStyling?: StylingEngineTypes.FormStyle,
) => {
  useApplyUserDefinedStyling(formStyling, applyCssMappings)
}

export default useApplyUserDefinedFormStyling

const applyCssMappings = (formStyling: StylingEngineTypes.FormStyle) => {
  return objectEntriesAsKeyValuePairs(formStyling).reduce<
    CssMappings<typeof stylingTargets>
  >((memo, { key, value }) => {
    // if (keyVal.value === undefined) return memo
    switch (key) {
      case 'backgroundColour':
        {
          memo['.forms-renderer']['background-color'] = value
          // Outer background colour should not dictate the inner background colour
          if (!formStyling.formContainer?.backgroundColour) {
            memo['.ob-form-container']['background-color'] = 'white'
          }
        }
        break
      case 'formContainer': {
        objectEntriesAsKeyValuePairs(value).forEach(({ key, value }) => {
          switch (key) {
            case 'backgroundColour': {
              memo['.ob-form-container'][cssKeys[key]] = value
              break
            }
            case 'padding': {
              memo['.ob-form-container'][cssKeys[key]] = `${value}rem`
              break
            }
            case 'borderColour': {
              memo['.ob-form-container'][cssKeys[key]] = value
              break
            }
            case 'borderRadius': {
              memo['.ob-form-container'][cssKeys[key]] = `${value}px`
              break
            }
            case 'borderWidth': {
              memo['.ob-form-container'][cssKeys[key]] = `${value}px`
              memo['.ob-form-container']['border-style'] = 'solid'
              break
            }
            case 'elementContainer': {
              objectEntriesAsKeyValuePairs(value).forEach(({ key, value }) => {
                switch (key) {
                  case 'marginBottom': {
                    memo['.ob-element:not(:last-child)'][cssKeys[key]] =
                      `${value}rem`
                    break
                  }
                  case 'label': {
                    objectEntriesAsKeyValuePairs(value).forEach(
                      ({ key, value }) => {
                        switch (key) {
                          case 'fontColor': {
                            memo['.ob-label'][cssKeys[key]] = value
                            break
                          }
                          case 'fontSize': {
                            memo['.ob-label'][cssKeys[key]] = `${value}rem`
                            break
                          }
                          case 'fontWeight': {
                            memo['.ob-label'][cssKeys[key]] = value
                            break
                          }
                          default: {
                            neverKey(key)
                          }
                        }
                      },
                    )
                    break
                  }
                  case 'heading': {
                    objectEntriesAsKeyValuePairs(value).forEach(
                      ({ key, value }) => {
                        switch (key) {
                          case 'backgroundColour': {
                            memo['.ob-heading'][cssKeys[key]] = value
                            break
                          }
                          case 'padding': {
                            memo['.ob-heading'][cssKeys[key]] = `${value}rem`
                            break
                          }
                          case 'borderColour': {
                            memo['.ob-heading'][cssKeys[key]] = value
                            break
                          }
                          case 'borderRadius': {
                            memo['.ob-heading'][cssKeys[key]] = `${value}px`
                            break
                          }
                          case 'borderWidth': {
                            memo['.ob-heading'][cssKeys[key]] = `${value}px`

                            memo['.ob-heading']['border-style'] = 'solid'
                            break
                          }
                          case 'headingSize': {
                            objectEntriesAsKeyValuePairs(value).forEach(
                              ({ key: sizeKey, value }) => {
                                objectEntriesAsKeyValuePairs(value).forEach(
                                  ({ key, value }) => {
                                    switch (key) {
                                      case 'fontColor': {
                                        memo[
                                          `.title.is-${sizeKey as HeadingSizeKey}`
                                        ][cssKeys[key]] = value
                                        break
                                      }
                                      case 'fontSize': {
                                        memo[
                                          `.title.is-${sizeKey as HeadingSizeKey}`
                                        ][cssKeys[key]] = `${value}rem`
                                        break
                                      }
                                      case 'fontWeight': {
                                        memo[
                                          `.title.is-${sizeKey as HeadingSizeKey}`
                                        ][cssKeys[key]] = value
                                        break
                                      }
                                      default: {
                                        neverKey(key)
                                      }
                                    }
                                  },
                                )
                              },
                            )
                            break
                          }
                          default: {
                            neverKey(key)
                          }
                        }
                      },
                    )
                    break
                  }

                  default: {
                    neverKey(key)
                  }
                }
              })
              break
            }

            default: {
              neverKey(key)
            }
          }
        })
        break
      }
    }

    return memo
  }, stylingTargets)
}
