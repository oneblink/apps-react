import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import useBooleanState from '../hooks/useBooleanState'
import { checkSectionValidity } from '../services/form-validation'
import scrollingService from '../services/scrolling-service'
import {
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../types/form'

export default function usePages({
  pages,
  formElementsValidation,
  formElementsConditionallyShown,
  hasAttemptedSubmit,
}: {
  pages: FormTypes.PageElement[]
  formElementsValidation: FormElementsValidation | undefined
  formElementsConditionallyShown: FormElementsConditionallyShown
  hasAttemptedSubmit: boolean
}) {
  const scrollToTopOfPageHTMLElementRef = React.useRef<HTMLDivElement>(null)
  const [visitedPageIds, setVisitedPageIds] = React.useState<string[]>([])

  const [isStepsHeaderActive, , closeStepsNavigation, toggleStepsNavigation] =
    useBooleanState(false)

  const visiblePages = React.useMemo<FormTypes.PageElement[]>(() => {
    return pages.filter((pageElement) => {
      return !formElementsConditionallyShown?.[pageElement.id]?.isHidden
    })
  }, [formElementsConditionallyShown, pages])

  const [currentPageId, setCurrentPageId] = React.useState(visiblePages[0].id)

  const currentPage = React.useMemo(() => {
    const currentPageById = visiblePages.find((pageElement) => {
      return pageElement.id === currentPageId
    })
    if (currentPageById) {
      return currentPageById
    } else {
      return visiblePages[0]
    }
  }, [currentPageId, visiblePages])

  const currentPageIndex = React.useMemo(
    () => visiblePages.indexOf(currentPage),
    [currentPage, visiblePages],
  )

  const currentPageNumber = React.useMemo(() => {
    if (currentPage) {
      return visiblePages.indexOf(currentPage) + 1
    }
  }, [currentPage, visiblePages])

  const isShowingMultiplePages = visiblePages.length > 1

  const setPageId = React.useCallback(
    (pageId: string) => {
      setVisitedPageIds((currentVisitedPageIds) => {
        if (currentVisitedPageIds.includes(currentPageId)) {
          return currentVisitedPageIds
        } else {
          return [...currentVisitedPageIds, currentPageId]
        }
      })
      setCurrentPageId(pageId)
      closeStepsNavigation()

      const scrollToTopOfPageHTMLElement =
        scrollToTopOfPageHTMLElementRef.current
      if (isShowingMultiplePages && scrollToTopOfPageHTMLElement) {
        if (scrollToTopOfPageHTMLElement) {
          window.requestAnimationFrame(() => {
            scrollToTopOfPageHTMLElement.scrollIntoView({
              block: 'end',
              behavior: 'smooth',
            })
          })
        }
        const stepItemHTMLElement = document.getElementById(
          `steps-navigation-step-${pageId}`,
        )
        if (stepItemHTMLElement) {
          window.requestAnimationFrame(() => {
            stepItemHTMLElement.scrollIntoView({
              block: 'start',
              behavior: 'smooth',
            })
          })
        }
        //blur prev/next buttons after they've been clicked
        const activeElement = document?.activeElement as HTMLElement
        activeElement.blur()
      }
    },
    [closeStepsNavigation, currentPageId, isShowingMultiplePages],
  )

  const goToNextPage = React.useCallback(() => {
    for (let i = 0; i < visiblePages.length; i++) {
      const page = visiblePages[i]
      if (page.id === currentPageId) {
        const nextVisiblePage = visiblePages[i + 1]
        if (nextVisiblePage) {
          setPageId(nextVisiblePage.id)
        }
        break
      }
    }
  }, [currentPageId, setPageId, visiblePages])

  const goToPreviousPage = React.useCallback(() => {
    for (let i = visiblePages.length - 1; i > -1; i--) {
      const page = visiblePages[i]
      if (page && page.id === currentPageId) {
        const previousVisiblePage = visiblePages[i - 1]
        if (previousVisiblePage) {
          setPageId(previousVisiblePage.id)
        }
        break
      }
    }
  }, [currentPageId, setPageId, visiblePages])

  const checkDisplayPageError = React.useCallback(
    (page: FormTypes.PageElement) => {
      // If we have not visited the page yet, we will not display errors
      if (!visitedPageIds.includes(page.id) && !hasAttemptedSubmit) {
        return false
      }

      return checkSectionValidity(page, formElementsValidation)
    },
    [formElementsValidation, visitedPageIds, hasAttemptedSubmit],
  )

  React.useEffect(() => {
    console.log('currentPageId has changed', currentPageId)
    // if (isStepsHeaderActive) {
    //   scrollingService.disableScrolling()

    const activeStepElement = document.getElementById(
      `steps-navigation-step-${currentPageId}`,
    )

    if (activeStepElement) {
      activeStepElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
    // } else {
    //   // Re-enable scroll on body when inactive
    //   scrollingService.enableScrolling()
    // }
  }, [currentPageId, isStepsHeaderActive])

  const firstVisiblePage = visiblePages[0]
  const lastVisiblePage = visiblePages[visiblePages.length - 1]
  const isLastVisiblePage =
    lastVisiblePage && lastVisiblePage.id === currentPageId
  const isFirstVisiblePage =
    firstVisiblePage && firstVisiblePage.id === currentPageId
  const isDisplayingCurrentPageError = checkDisplayPageError(currentPage)

  // Clean up when form is navigated away
  React.useEffect(() => {
    return () => {
      scrollingService.enableScrolling()
    }
  }, [])

  return {
    visiblePages,
    isFirstVisiblePage,
    isLastVisiblePage,
    isDisplayingCurrentPageError,
    isShowingMultiplePages,
    isStepsHeaderActive,
    toggleStepsNavigation,
    currentPageIndex,
    currentPage,
    currentPageNumber,
    checkDisplayPageError,
    setPageId,
    goToPreviousPage,
    goToNextPage,
    scrollToTopOfPageHTMLElementRef,
  }
}
