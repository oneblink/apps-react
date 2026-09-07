import * as React from 'react'

type FormIsDirtyContextValue = {
  register: (isDirty: boolean) => () => void
  isDirty: () => boolean
}

const FormIsDirtyContext = React.createContext<FormIsDirtyContextValue | null>(
  null,
)

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
  const isDirtyRef = React.useRef(false)
  const [, forceRender] = React.useReducer((count: number) => count + 1, 0)

  const register = React.useCallback((isDirty: boolean) => {
    isDirtyRef.current = isDirty
    forceRender()
    return () => {
      isDirtyRef.current = false
      forceRender()
    }
  }, [])

  const isDirty = React.useCallback(() => isDirtyRef.current, [])

  const value = React.useMemo(
    () => ({
      register,
      isDirty,
    }),
    [isDirty, register],
  )

  return (
    <FormIsDirtyContext.Provider value={value}>
      {children}
    </FormIsDirtyContext.Provider>
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
  const context = React.useContext(FormIsDirtyContext)
  return context?.isDirty() ?? false
}

/**
 * Registers this form’s unsaved-changes flag with the nearest
 * {@link FormIsDirtyContextProvider}. Used internally by `OneBlinkFormBase`.
 */
export function useRegisterFormIsDirty(isDirty: boolean): void {
  const context = React.useContext(FormIsDirtyContext)

  React.useLayoutEffect(() => {
    return context?.register(isDirty)
  }, [context, isDirty])
}
