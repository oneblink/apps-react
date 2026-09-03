import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, test } from 'vitest'
import {
  FormSubmissionAttempt,
  FormSubmissionAttemptAllowNavigation,
  FormSubmissionAttemptContextProvider,
  useFormSubmissionAttempt,
  useRegisterFormSubmissionAttempt,
} from '../src/hooks/useFormSubmissionAttempt'

function Host({
  attemptRef,
}: {
  attemptRef: React.RefObject<FormSubmissionAttempt | null>
}) {
  const attempt = useFormSubmissionAttempt()
  React.useEffect(() => {
    attemptRef.current = attempt
    return () => {
      attemptRef.current = null
    }
  }, [attempt, attemptRef])
  return null
}

function Form({
  result,
}: {
  result: false | FormSubmissionAttemptAllowNavigation
}) {
  const attempt = React.useCallback(() => Promise.resolve(result), [result])
  useRegisterFormSubmissionAttempt(attempt)
  return null
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('FormSubmissionAttemptContextProvider', () => {
  test('runs a registered form submission attempt', async () => {
    const attemptRef = React.createRef<FormSubmissionAttempt>()
    const root = createRoot(
      document.body.appendChild(document.createElement('div')),
    )

    await React.act(async () => {
      root.render(
        <FormSubmissionAttemptContextProvider>
          <Host attemptRef={attemptRef} />
          <Form result={false} />
        </FormSubmissionAttemptContextProvider>,
      )
    })

    await expect(attemptRef.current?.()).resolves.toBe(false)

    await React.act(async () => root.unmount())
  })

  test('returns the registered allow-navigation callback on success', async () => {
    const attemptRef = React.createRef<FormSubmissionAttempt>()
    const allowNavigation = () => {}
    const root = createRoot(
      document.body.appendChild(document.createElement('div')),
    )

    await React.act(async () => {
      root.render(
        <FormSubmissionAttemptContextProvider>
          <Host attemptRef={attemptRef} />
          <Form result={allowNavigation} />
        </FormSubmissionAttemptContextProvider>,
      )
    })

    await expect(attemptRef.current?.()).resolves.toBe(allowNavigation)

    await React.act(async () => root.unmount())
  })

  test('allows submission when no form attempt is registered', async () => {
    const attemptRef = React.createRef<FormSubmissionAttempt>()
    const root = createRoot(
      document.body.appendChild(document.createElement('div')),
    )

    await React.act(async () => {
      root.render(
        <FormSubmissionAttemptContextProvider>
          <Host attemptRef={attemptRef} />
        </FormSubmissionAttemptContextProvider>,
      )
    })

    await expect(attemptRef.current?.()).resolves.toEqual(expect.any(Function))

    await React.act(async () => root.unmount())
  })
})
