import { memo, useEffect, useState } from 'react'
import { FormTypes } from '@oneblink/types'
import useReplaceableText from '../hooks/useReplaceableText'
import QuillHTML from '../components/QuillHTML'
import useIsPageVisible from '../hooks/useIsPageVisible'
import useIsSectionExpanded from '../hooks/useIsSectionExpanded'

// Long enough for screen readers to pick up the alert after it is rendered,
// short enough that it is unlikely to still be active when another is shown
const SCREEN_READER_ALERT_DURATION_MS = 2000

/**
 * Only apply the alert role for a short time after the element becomes visible.
 * Alert regions left in the DOM can be announced again by some screen readers
 * (e.g. NVDA) when another alert is shown, which reads out every visible alert
 * instead of only the new one.
 *
 * Elements on inactive pages and in collapsed sections stay mounted while
 * hidden, so the alert is (re)activated whenever the element becomes visible
 * rather than when it is mounted.
 */
const useIsScreenReaderAlertActive = (screenReaderAlert: boolean) => {
  const isPageVisible = useIsPageVisible()
  const isSectionExpanded = useIsSectionExpanded()
  const isVisibleAlert = screenReaderAlert && isPageVisible && isSectionExpanded

  const [isActive, setIsActive] = useState(isVisibleAlert)
  const [previousIsVisibleAlert, setPreviousIsVisibleAlert] =
    useState(isVisibleAlert)
  // Updating state during render (instead of in an effect) makes React discard
  // this render and re-render immediately, so the alert role is committed to
  // the DOM at the same time the element becomes visible
  if (isVisibleAlert !== previousIsVisibleAlert) {
    setPreviousIsVisibleAlert(isVisibleAlert)
    setIsActive(isVisibleAlert)
  }

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
