import * as React from 'react'
import { formService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import FormElementForm, { Props } from './FormElementForm'
import generateCivicaNameRecordElements from '../services/generateCivicaNameRecordElements'

function FormElementCivicaNameRecord({
  element,
  ...props
}: Omit<Props, 'element'> & {
  element: FormTypes.CivicaNameRecordElement
}) {
  const [state, setState] = React.useState<{
    isLoading: boolean
    titleCodeOptions?: FormTypes.ChoiceElementOption[]
    loadError?: Error
  }>({
    isLoading: true,
  })

  const formElement = React.useMemo<FormTypes.FormFormElement>(() => {
    return {
      id: element.id,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      type: 'form',
      name: element.name,
      formId: NaN,
      elements: generateCivicaNameRecordElements(
        element,
        state.titleCodeOptions,
      ),
    }
  }, [element, state.titleCodeOptions])

  React.useEffect(() => {
    setState({
      isLoading: true,
    })
    const abortController = new AbortController()

    const request = async () => {
      try {
        const items = await formService.getCivicaTitleCodes(
          props.formId,
          abortController.signal,
        )
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            titleCodeOptions: items,
          })
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            loadError: error,
          })
        }
      }
    }
    request()

    return () => {
      abortController.abort()
    }
  }, [props.formId])

  return <FormElementForm element={formElement} {...props} />
}
export default React.memo(FormElementCivicaNameRecord)
