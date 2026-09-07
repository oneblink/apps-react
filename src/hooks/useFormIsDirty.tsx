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
      <FormIsDirtyContext.Provider value={isDirtyByFormId}>
        {children}
      </FormIsDirtyContext.Provider>
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
 * Registers this form’s unsaved-changes flag with the nearest
 * {@link FormIsDirtyContextProvider}. Used internally by `OneBlinkFormBase`.
 */
export function useRegisterFormIsDirty(formId: number, isDirty: boolean): void {
  const register = React.useContext(RegisterFormIsDirtyContext)

  React.useLayoutEffect(() => {
    return register?.(formId, isDirty)
  }, [register, formId, isDirty])
}
