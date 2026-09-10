import * as React from 'react'

const emptyDirtyByFormId: ReadonlyMap<number, boolean> = new Map()

const FormIsDirtyContext =
  React.createContext<ReadonlyMap<number, boolean>>(emptyDirtyByFormId)

// Kept separate from the value so registering does not re-render the form
// every time the flag changes.
const RegisterFormIsDirtyContext = React.createContext<
  ((formId: number, isDirty: boolean) => () => void) | undefined
>(undefined)

const FormMarkDirtyContext = React.createContext<() => void>(() => {})

const RegisterAllowFormNavigationContext = React.createContext<
  ((formId: number, allowNavigation: () => void) => () => void) | undefined
>(undefined)

const AllowFormNavigationContext = React.createContext<
  (formId: number) => void
>(() => {})

export function useMarkFormDirty(): () => void {
  return React.useContext(FormMarkDirtyContext)
}

export function FormMarkDirtyContextProvider({
  markDirty,
  children,
}: {
  markDirty: () => void
  children: React.ReactNode
}) {
  return (
    <FormMarkDirtyContext.Provider value={markDirty}>
      {children}
    </FormMarkDirtyContext.Provider>
  )
}

/**
 * Optional context that lets a host (for example Approvals) read whether a
 * rendered form has unsaved user edits. Derived writes (`isDerivedChange`) do
 * not set this.
 *
 * Wrap both the form and the host action so they share one registry. Each form
 * registers under its `formId`, so multiple forms under the same provider (for
 * example an approval form in a dialog) keep independent flags. If nothing is
 * registered for a form, {@link useFormIsDirty} is `false`.
 *
 * @param props
 * @returns
 * @group Components
 */
export function FormIsDirtyContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Must be state, not a ref. Hosts reading this are siblings of the form, so
  // they only re-render if the context value itself changes.
  const [isDirtyByFormId, setIsDirtyByFormId] = React.useState(
    () => new Map<number, boolean>(),
  )

  // Kept in a ref, not state, so registering a form does not re-render hosts
  // reading the dirty flags.
  const allowNavigationByFormId = React.useRef(
    new Map<number, () => void>(),
  ).current

  const registerAllowNavigation = React.useCallback(
    (formId: number, allowNavigation: () => void) => {
      allowNavigationByFormId.set(formId, allowNavigation)
      return () => {
        if (allowNavigationByFormId.get(formId) === allowNavigation) {
          allowNavigationByFormId.delete(formId)
        }
      }
    },
    [allowNavigationByFormId],
  )

  const allowNavigation = React.useCallback(
    (formId: number) => {
      allowNavigationByFormId.get(formId)?.()
    },
    [allowNavigationByFormId],
  )

  const register = React.useCallback((formId: number, isDirty: boolean) => {
    setIsDirtyByFormId((current) => {
      if (current.get(formId) === isDirty) {
        return current
      }
      const next = new Map(current)
      next.set(formId, isDirty)
      return next
    })
    return () => {
      setIsDirtyByFormId((current) => {
        if (!current.has(formId)) {
          return current
        }
        const next = new Map(current)
        next.delete(formId)
        return next
      })
    }
  }, [])

  return (
    <RegisterFormIsDirtyContext.Provider value={register}>
      <RegisterAllowFormNavigationContext.Provider
        value={registerAllowNavigation}
      >
        <AllowFormNavigationContext.Provider value={allowNavigation}>
          <FormIsDirtyContext.Provider value={isDirtyByFormId}>
            {children}
          </FormIsDirtyContext.Provider>
        </AllowFormNavigationContext.Provider>
      </RegisterAllowFormNavigationContext.Provider>
    </RegisterFormIsDirtyContext.Provider>
  )
}

/**
 * Whether the form with `formId` has unsaved user edits. Safe to call without a
 * provider: returns `false`.
 *
 * @param formId
 * The id of the form whose dirty flag to read.
 * @returns
 * @group Hooks
 */
export function useFormIsDirty(formId: number): boolean {
  return React.useContext(FormIsDirtyContext).get(formId) ?? false
}

/**
 * Returns a callback that stops the form with `formId` prompting about unsaved
 * changes when the host navigates away. Call it after the host action that
 * discarded or persisted those edits has completed, immediately before
 * navigating. Safe to call without a provider or for a form that is not
 * rendered: nothing happens.
 *
 * @param formId
 * The id of the form whose unsaved changes prompt to stop.
 * @returns
 * @group Hooks
 */
export function useAllowFormNavigation(formId: number): () => void {
  const allowNavigation = React.useContext(AllowFormNavigationContext)

  return React.useCallback(
    () => allowNavigation(formId),
    [allowNavigation, formId],
  )
}

/**
 * Registers this form’s unsaved-changes flag with the nearest
 * {@link FormIsDirtyContextProvider}. Used internally by `OneBlinkFormBase`.
 */
export function useRegisterFormIsDirty(formId: number, isDirty: boolean): void {
  const register = React.useContext(RegisterFormIsDirtyContext)

  React.useLayoutEffect(() => {
    return register?.(formId, isDirty)
  }, [register, formId, isDirty])
}

/**
 * Registers the callback {@link useAllowFormNavigation} calls for this form.
 * Used internally by `OneBlinkFormBase`.
 */
export function useRegisterAllowFormNavigation(
  formId: number,
  allowNavigation: () => void,
): void {
  const register = React.useContext(RegisterAllowFormNavigationContext)

  React.useLayoutEffect(() => {
    return register?.(formId, allowNavigation)
  }, [register, formId, allowNavigation])
}
