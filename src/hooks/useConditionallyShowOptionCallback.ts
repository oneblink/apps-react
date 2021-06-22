import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export type ConditionallyShowOptionCallbackContextValue = (
  formElementsCtrl: FormElementsCtrl,
  formElementWithOptions: FormTypes.FormElementWithOptions,
  choiceElementOption: FormTypes.ChoiceElementOption,
) => boolean

const defaultContext = () => true

export const ConditionallyShowOptionCallbackContext =
  React.createContext<ConditionallyShowOptionCallbackContextValue>(
    defaultContext,
  )

export default function useConditionallyShowOptionCallback(
  formElementsCtrl: FormElementsCtrl,
  element: FormTypes.FormElement,
) {
  const onConditionallyShowOption = React.useContext(
    ConditionallyShowOptionCallbackContext,
  )

  return React.useMemo(() => {
    if (
      (element.type !== 'select' &&
        element.type !== 'compliance' &&
        element.type !== 'radio' &&
        element.type !== 'checkboxes' &&
        element.type !== 'autocomplete') ||
      !element.conditionallyShowOptions
    ) {
      return defaultContext
    }

    return (option: FormTypes.ChoiceElementOption) => {
      return onConditionallyShowOption(formElementsCtrl, element, option)
    }
  }, [element, formElementsCtrl, onConditionallyShowOption])
}
