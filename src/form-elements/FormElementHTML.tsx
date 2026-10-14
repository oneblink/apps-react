import { memo, useEffect, useState } from 'react'
import { FormTypes } from '@oneblink/types'
import useReplaceableText from '../hooks/useReplaceableText'
import QuillHTML from '../components/QuillHTML'

// Long enough for screen readers to pick up the alert after it is rendered,
// short enough that it is unlikely to still be active when another is shown
const SCREEN_READER_ALERT_DURATION_MS = 2000

/**
 * Only apply the alert role for a short time after the element is shown. Alert
 * regions left in the DOM can be announced again by some screen readers (e.g.
 * NVDA) when another alert is shown, which reads out every visible alert
 * instead of only the new one. `screenReaderAlert` is only read on mount as the
 * alert should only be announced when the element is shown.
 */
const useIsScreenReaderAlertActive = (screenReaderAlert: boolean) => {
  const [isActive, setIsActive] = useState(screenReaderAlert)

  useEffect(() => {
    if (!isActive) {
      return
    }
    const timeoutId = setTimeout(
      () => setIsActive(false),
      SCREEN_READER_ALERT_DURATION_MS,
    )
    return () => clearTimeout(timeoutId)
  }, [isActive])

  return isActive
}

type Props = {
  element: FormTypes.HtmlElement
}

const FormElementHTML = ({ element }: Props) => {
  const html = useReplaceableText(element.defaultValue)
  const isScreenReaderAlertActive = useIsScreenReaderAlertActive(
    !!element.screenReaderAlert,
  )

  return (
    <div className="cypress-html-element">
      <div
        className="ob-form__element ob-information cypress-html-element"
        role={isScreenReaderAlertActive ? 'alert' : undefined}
      >
        <QuillHTML
          html={html}
          className="cypress-html-element-content ob-information__content"
        />
      </div>
    </div>
  )
}

export default memo(FormElementHTML)
