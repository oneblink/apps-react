import * as React from 'react'

/**
 * Call after the host has successfully persisted the edits (for example after
 * an approval upload). This clears the unsaved-changes navigation guard.
 *
 * Do not call it until that work has finished: cancelling a confirmation dialog
 * after a successful attempt must still prompt if the user navigates away.
 */
export type FormSubmissionAttemptAllowNavigation = () => void

/**
 * Runs the form’s existing submit-preparation path (validation, BSB checks,
 * attachments, and the same error UI as a real submit).
 *
 * Resolves with {@link FormSubmissionAttemptAllowNavigation} when the host may
 * continue (for example approve and upload an edit). Resolves `false` when
 * preparation failed; field errors and toasts have already been shown. Does
 * **not** call `onSubmit`, captcha, or analytics.
 */
export type FormSubmissionAttempt = () => Promise<
  false | FormSubmissionAttemptAllowNavigation
>

type FormSubmissionAttemptContextValue = {
  register: (attempt: FormSubmissionAttempt) => () => void
  attempt: FormSubmissionAttempt
}

const FormSubmissionAttemptContext =
  React.createContext<FormSubmissionAttemptContextValue | null>(null)

/**
 * Optional context that lets a host (for example Approvals) trigger the
 * rendered form’s submit-preparation path without duplicating it.
 *
 * Wrap both the form and the host action (Approve) so they share one registry.
 * `OneBlinkFormBase` registers when `editableFormElementIds` is set. If nothing
 * is registered, {@link useFormSubmissionAttempt} still resolves with a no-op
 * {@link FormSubmissionAttemptAllowNavigation} so hosts without an editable form
 * are unchanged.
 *
 * #### Example
 *
 * ```jsx
 * import {
 *   FormSubmissionAttemptContextProvider,
 *   OneBlinkReadOnlyForm,
 *   useFormSubmissionAttempt,
 * } from '@oneblink/apps-react'
 *
 * function ApproveButton() {
 *   const attemptFormSubmission = useFormSubmissionAttempt()
 *
 *   const onClickApprove = async () => {
 *     const allowNavigation = await attemptFormSubmission()
 *     if (!allowNavigation) {
 *       return
 *     }
 *     // continue with the host action, then:
 *     allowNavigation()
 *   }
 *
 *   return <button onClick={onClickApprove}>Approve</button>
 * }
 *
 * function Approval() {
 *   return (
 *     <FormSubmissionAttemptContextProvider>
 *       <OneBlinkReadOnlyForm editableFormElementIds={['element-id']} />
 *       <ApproveButton />
 *     </FormSubmissionAttemptContextProvider>
 *   )
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export function FormSubmissionAttemptContextProvider({
  children,
}: {
  /** The form and the host action that must share one submission attempt. */
  children: React.ReactNode
}) {
  const attemptsRef = React.useRef<FormSubmissionAttempt[]>([])

  const register = React.useCallback((attempt: FormSubmissionAttempt) => {
    attemptsRef.current.push(attempt)
    return () => {
      attemptsRef.current = attemptsRef.current.filter(
        (registeredAttempt) => registeredAttempt !== attempt,
      )
    }
  }, [])

  const attempt = React.useCallback<FormSubmissionAttempt>(() => {
    const registeredAttempts = attemptsRef.current
    return (
      registeredAttempts[registeredAttempts.length - 1]?.() ??
      Promise.resolve(noopAllowNavigation)
    )
  }, [])

  const value = React.useMemo(
    () => ({
      register,
      attempt,
    }),
    [attempt, register],
  )

  return (
    <FormSubmissionAttemptContext.Provider value={value}>
      {children}
    </FormSubmissionAttemptContext.Provider>
  )
}

/**
 * Returns the latest form submission attempt registered under a
 * {@link FormSubmissionAttemptContextProvider}. Safe to call without a provider:
 * preparation is skipped and the promise resolves with a no-op
 * {@link FormSubmissionAttemptAllowNavigation}.
 *
 * @returns
 * @group Hooks
 */
export function useFormSubmissionAttempt(): FormSubmissionAttempt {
  const context = React.useContext(FormSubmissionAttemptContext)
  return context?.attempt ?? allowSubmissionAttempt
}

/**
 * Registers this form’s {@link FormSubmissionAttempt} with the nearest
 * {@link FormSubmissionAttemptContextProvider}, if one exists. Used internally
 * by `OneBlinkFormBase` when `editableFormElementIds` is provided. Pass
 * `undefined` to skip registration (for example a fully read-only form).
 */
export function useRegisterFormSubmissionAttempt(
  attempt: FormSubmissionAttempt | undefined,
): void {
  const context = React.useContext(FormSubmissionAttemptContext)

  React.useLayoutEffect(() => {
    if (attempt) {
      return context?.register(attempt)
    }
  }, [attempt, context])
}

function noopAllowNavigation() {}

function allowSubmissionAttempt(): Promise<FormSubmissionAttemptAllowNavigation> {
  return Promise.resolve(noopAllowNavigation)
}
