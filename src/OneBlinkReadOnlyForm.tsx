import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import OneBlinkFormBase from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'
import { FormSubmissionModel } from './types/form'

function recursivelySetReadOnly<
  T extends { elements?: FormTypes.FormElement[] },
>(parent: T): T {
  const newElements = parent?.elements
    ?.filter((element) => element.type !== 'captcha')
    ?.map((element) => {
      if (
        (element.type === 'form' ||
          element.type === 'section' ||
          element.type === 'page' ||
          element.type === 'repeatableSet') &&
        Array.isArray(element.elements)
      ) {
        return {
          ...element,
          elements: recursivelySetReadOnly(element),
        }
      }

      if (
        element.type !== 'section' &&
        element.type !== 'heading' &&
        element.type !== 'page' &&
        element.type !== 'html' &&
        element.type !== 'captcha' &&
        element.type !== 'image' &&
        element.type !== 'calculation' &&
        element.type !== 'summary' &&
        element.type !== 'form' &&
        element.type !== 'infoPage'
      ) {
        return {
          ...element,
          readOnly: true,
        }
      }

      return element
    })

  return {
    ...parent,
    elements: newElements,
  }
}

type Props = {
  form: FormTypes.Form
  initialSubmission?: FormSubmissionModel
  googleMapsApiKey?: string
}

function OneBlinkReadOnlyForm({ form, initialSubmission, ...rest }: Props) {
  const [{ submission, definition }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const readOnlyDefinition = React.useMemo(() => {
    return recursivelySetReadOnly(definition)
  }, [definition])

  const noop = React.useCallback(() => {}, [])

  return (
    <OneBlinkFormBase
      definition={readOnlyDefinition}
      submission={submission}
      disabled={true}
      isReadOnly={true}
      onCancel={noop}
      onSubmit={noop}
      setFormSubmission={setFormSubmission}
      {...rest}
    />
  )
}

export default React.memo(OneBlinkReadOnlyForm)
