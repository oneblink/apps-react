import * as React from 'react'

const FormIsDirtyContext = React.createContext<boolean>(false)

// Kept separate from the value so registering does not re-render the form
// every time the flag changes.
const RegisterFormIsDirtyContext = React.createContext<
  ((isDirty: boolean) => () => void) | undefined
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
 * Optional context that lets a host (for example Approvals) read whether the
 * rendered form has unsaved user edits. Derived writes (`isDerivedChange`) do
 * not set this.
 *
 * Wrap both the form and the host action so they share one registry.
 * `OneBlinkFormBase` registers its unsaved-changes flag. If nothing is
 * registered, {@link useFormIsDirty} is `false`.
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
  const [isDirty, setIsDirty] = React.useState(false)

  const register = React.useCallback((isDirty: boolean) => {
    setIsDirty(isDirty)
    return () => {
      setIsDirty(false)
    }
  }, [])

  return (
    <RegisterFormIsDirtyContext.Provider value={register}>
      <FormIsDirtyContext.Provider value={isDirty}>
        {children}
      </FormIsDirtyContext.Provider>
    </RegisterFormIsDirtyContext.Provider>
  )
}

/**
 * Whether the rendered form has unsaved user edits. Safe to call without a
 * provider: returns `false`.
 *
 * @returns
 * @group Hooks
 */
export function useFormIsDirty(): boolean {
  return React.useContext(FormIsDirtyContext)
}

/**
 * Registers this form’s unsaved-changes flag with the nearest
 * {@link FormIsDirtyContextProvider}. Used internally by `OneBlinkFormBase`.
 */
export function useRegisterFormIsDirty(isDirty: boolean): void {
  const register = React.useContext(RegisterFormIsDirtyContext)

  React.useLayoutEffect(() => {
    return register?.(isDirty)
  }, [register, isDirty])
}
