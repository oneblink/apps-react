// @flow

import * as React from 'react'

/* ::
export type ConditionallyShowOptionCallbackContextValue = (
  FormElementsCtrl,
  FormElementWithOptions,
  ChoiceElementOption,
) => boolean
*/

const defaultContext = () => true

export const ConditionallyShowOptionCallbackContext /* : React.Context<ConditionallyShowOptionCallbackContextValue> */ = React.createContext(
  defaultContext,
)

export default function useConditionallyShowOptionCallback(
  formElementsCtrl /* : FormElementsCtrl */,
  element /* : FormElement */,
) {
  const onConditionallyShowOption = React.useContext(
    ConditionallyShowOptionCallbackContext,
  )

  return React.useMemo(() => {
    if (
      (element.type !== 'select' &&
        element.type !== 'radio' &&
        element.type !== 'checkboxes' &&
        element.type !== 'autocomplete') ||
      !element.conditionallyShowOptions
    ) {
      return defaultContext
    }

    return (option /* : ChoiceElementOption */) => {
      return onConditionallyShowOption(formElementsCtrl, element, option)
    }
  }, [element, formElementsCtrl, onConditionallyShowOption])
}
