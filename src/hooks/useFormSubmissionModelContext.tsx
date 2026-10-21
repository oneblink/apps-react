import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { FormElement } from '@oneblink/types/typescript/forms'
import * as React from 'react'
import cleanFormSubmissionModel from '../services/cleanFormSubmissionModel'
import { FormElementsConditionallyShown } from '../types/form'

export type FormSubmissionModelContextValue = {
  formSubmissionModel: SubmissionTypes.S3SubmissionData['submission']
  parent?: FormSubmissionModelContextValue
  elements: FormElement[]
}

type LocalFormSubmissionModelContextValue = Omit<
  FormSubmissionModelContextValue,
  'parent'
>

// The local value is kept separate from the context that includes `parent` so
// that consumers inside a repeatable set entry do not re-render whenever a value
// outside of the entry changes. A separate context is used for each level of
// nesting because React re-renders every consumer of a context below a provider
// whose value changed, even consumers below a nested provider of the same
// context.
const LocalFormSubmissionModelContexts: Array<
  React.Context<LocalFormSubmissionModelContextValue | undefined>
> = []
function getLocalFormSubmissionModelContext(depth: number) {
  let context = LocalFormSubmissionModelContexts[depth]
  if (!context) {
    context = React.createContext<
      LocalFormSubmissionModelContextValue | undefined
    >(undefined)
    LocalFormSubmissionModelContexts[depth] = context
  }
  return context
}
const FormSubmissionModelDepthContext = React.createContext(-1)

function useLocalFormSubmissionModelContext() {
  const depth = React.useContext(FormSubmissionModelDepthContext)
  return getLocalFormSubmissionModelContext(depth)
}

const FormSubmissionModelContext = React.createContext<
  FormSubmissionModelContextValue | undefined
>(undefined)

// Every page and section provider cleans the same root submission, so the
// result is shared between providers rendered with the same arguments.
const cleanFormSubmissionModelCache = new WeakMap<
  SubmissionTypes.S3SubmissionData['submission'],
  WeakMap<
    FormTypes.FormElement[],
    WeakMap<object, SubmissionTypes.S3SubmissionData['submission']>
  >
>()
const NO_FORM_ELEMENTS_CONDITIONALLY_SHOWN = {}
function getCleanFormSubmissionModel(
  model: SubmissionTypes.S3SubmissionData['submission'],
  elements: FormTypes.FormElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
) {
  if (typeof model !== 'object' || model === null) {
    return cleanFormSubmissionModel(
      model,
      elements,
      formElementsConditionallyShown,
      true,
    ).model
  }
  let byElements = cleanFormSubmissionModelCache.get(model)
  if (!byElements) {
    byElements = new WeakMap()
    cleanFormSubmissionModelCache.set(model, byElements)
  }
  let byConditionallyShown = byElements.get(elements)
  if (!byConditionallyShown) {
    byConditionallyShown = new WeakMap()
    byElements.set(elements, byConditionallyShown)
  }
  const conditionallyShownKey =
    formElementsConditionallyShown ?? NO_FORM_ELEMENTS_CONDITIONALLY_SHOWN
  let cleanModel = byConditionallyShown.get(conditionallyShownKey)
  if (!cleanModel) {
    cleanModel = cleanFormSubmissionModel(
      model,
      elements,
      formElementsConditionallyShown,
      true,
    ).model
    byConditionallyShown.set(conditionallyShownKey, cleanModel)
  }
  return cleanModel
}

export function FormSubmissionModelContextProvider({
  children,
  model,
  elements,
  formElementsConditionallyShown,
}: {
  model: SubmissionTypes.S3SubmissionData['submission']
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  children: React.ReactNode
}) {
  const formSubmissionModelContext = React.useContext(
    FormSubmissionModelContext,
  )
  const depth = React.useContext(FormSubmissionModelDepthContext) + 1
  const LocalFormSubmissionModelContext =
    getLocalFormSubmissionModelContext(depth)
  const localValue = React.useMemo(() => {
    return {
      formSubmissionModel: getCleanFormSubmissionModel(
        model,
        elements,
        formElementsConditionallyShown,
      ),
      elements,
    }
  }, [model, elements, formElementsConditionallyShown])
  const value = React.useMemo(() => {
    return {
      ...localValue,
      parent: formSubmissionModelContext,
    }
  }, [localValue, formSubmissionModelContext])
  return (
    <FormSubmissionModelContext.Provider value={value}>
      <FormSubmissionModelDepthContext.Provider value={depth}>
        <LocalFormSubmissionModelContext.Provider value={localValue}>
          {children}
        </LocalFormSubmissionModelContext.Provider>
      </FormSubmissionModelDepthContext.Provider>
    </FormSubmissionModelContext.Provider>
  )
}

function assertContextValue<T>(value: T | undefined): T {
  if (!value) {
    throw new Error(
      '"FormSubmissionModelContext" does not have a value in this context',
    )
  }
  return value
}

/**
 * The cleaned submission model and elements for the closest
 * `FormSubmissionModelContextProvider`, without access to parent models.
 */
export default function useFormSubmissionModel() {
  const LocalFormSubmissionModelContext = useLocalFormSubmissionModelContext()
  return assertContextValue(React.use(LocalFormSubmissionModelContext))
}

/**
 * The same as `useFormSubmissionModel()`, but also includes the parent models.
 * Pass `includeParent: false` to avoid re-rendering when values outside of the
 * closest `FormSubmissionModelContextProvider` change.
 */
export function useFormSubmissionModelWithParent(
  includeParent: boolean,
): LocalFormSubmissionModelContextValue & {
  parent?: FormSubmissionModelContextValue
} {
  const LocalFormSubmissionModelContext = useLocalFormSubmissionModelContext()
  return assertContextValue(
    React.use(
      includeParent
        ? FormSubmissionModelContext
        : LocalFormSubmissionModelContext,
    ),
  )
}

export function useFormSubmissionModelParent() {
  let formSubmissionModelContext = assertContextValue(
    React.useContext(FormSubmissionModelContext),
  )
  while (formSubmissionModelContext.parent) {
    formSubmissionModelContext = formSubmissionModelContext.parent
  }
  return formSubmissionModelContext
}
