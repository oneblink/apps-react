import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import useBooleanState from '../hooks/useBooleanState'
import { checkSectionValidity } from '../services/form-validation/validators'
import scrollingService from '../services/scrolling-service'
import {
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../types/form'
import { injectDynamicElements } from '../services/dynamic-elements'
import {
  getNavigablePages,
  getRenderedPages,
} from '../services/page-visibility'

export default function usePages({
  pages,
  formElementsValidation,
  formElementsConditionallyShown,
  hasAttemptedSubmit,
  scrollToTopOfPage,
  audience,
}: {
  pages: FormTypes.PageElement[]
  formElementsValidation: FormElementsValidation | undefined
  formElementsConditionallyShown: FormElementsConditionallyShown
  hasAttemptedSubmit: boolean
  scrollToTopOfPage?: boolean
  audience: FormTypes.FormElementHiddenFromAudience
}) {
  const scrollToTopOfPageHTMLElementRef = React.useRef<HTMLDivElement>(null)
  const [visitedPageIds, setVisitedPageIds] = React.useState<string[]>([])

  const [isStepsHeaderActive, , closeStepsNavigation, toggleStepsNavigation] =
    useBooleanState(false)

  const pagesWithDynamicElements = React.useMemo<
    FormTypes.PageElement[]
  >(() => {
    return injectDynamicElements(pages) as FormTypes.PageElement[]
  }, [pages])

  const renderedPages = React.useMemo<FormTypes.PageElement[]>(() => {
    return getRenderedPages(
      pagesWithDynamicElements,
      formElementsConditionallyShown,
    )
  }, [formElementsConditionallyShown, pagesWithDynamicElements])

  const visiblePages = React.useMemo<FormTypes.PageElement[]>(() => {
    return getNavigablePages(
      pagesWithDynamicElements,
      formElementsConditionallyShown,
      audience,
    )
  }, [audience, formElementsConditionallyShown, pagesWithDynamicElements])

  const [currentPageId, setCurrentPageId] = React.useState(
    () => visiblePages[0]?.id ?? '',
  )

  const currentPage = React.useMemo(() => {
    if (!visiblePages.length) {
      return undefined
    }
    return (
      visiblePages.find((pageElement) => {
        return pageElement.id === currentPageId
      }) ?? visiblePages[0]
    )
  }, [currentPageId, visiblePages])

  React.useEffect(() => {
    if (currentPage && currentPage.id !== currentPageId) {
      setCurrentPageId(currentPage.id)
    }
  }, [currentPage, currentPageId])

  const currentPageIndex = React.useMemo(
    () => (currentPage ? visiblePages.indexOf(currentPage) : -1),
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
      if (!visiblePages.some((page) => page.id === pageId)) {
        return
      }
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
        if (scrollToTopOfPage) {
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          })
        } else if (scrollToTopOfPageHTMLElement) {
          window.requestAnimationFrame(() => {
            scrollToTopOfPageHTMLElement.scrollIntoView({
              block: 'start',
              behavior: 'smooth',
            })
          })
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
        }

        // Move focus to the active page container after prev/next navigation
        window.requestAnimationFrame(() => {
          const pageContainer = document.getElementById(pageId)
          if (pageContainer) {
            pageContainer.focus({ preventScroll: true })
          }
        })
      }
    },
    [
      closeStepsNavigation,
      currentPageId,
      isShowingMultiplePages,
      scrollToTopOfPage,
      visiblePages,
    ],
  )

  const goToNextPage = React.useCallback(() => {
    if (!currentPage) {
      return
    }
    const index = visiblePages.indexOf(currentPage)
    const nextVisiblePage = visiblePages[index + 1]
    if (nextVisiblePage) {
      setPageId(nextVisiblePage.id)
    }
  }, [currentPage, setPageId, visiblePages])

  const goToPreviousPage = React.useCallback(() => {
    if (!currentPage) {
      return
    }
    const index = visiblePages.indexOf(currentPage)
    const previousVisiblePage = visiblePages[index - 1]
    if (previousVisiblePage) {
      setPageId(previousVisiblePage.id)
    }
  }, [currentPage, setPageId, visiblePages])

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
    if (isStepsHeaderActive) {
      scrollingService.disableScrolling()

      const activeStepElement = document.getElementById(
        `steps-navigation-step-${currentPageId}`,
      )

      if (activeStepElement) {
        activeStepElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    } else {
      // Re-enable scroll on body when inactive
      scrollingService.enableScrolling()
    }
  }, [currentPageId, isStepsHeaderActive])

  const firstVisiblePage = visiblePages[0]
  const lastVisiblePage = visiblePages[visiblePages.length - 1]
  const isLastVisiblePage =
    !!currentPage && !!lastVisiblePage && lastVisiblePage.id === currentPage.id
  const isFirstVisiblePage =
    !!currentPage &&
    !!firstVisiblePage &&
    firstVisiblePage.id === currentPage.id
  const isDisplayingCurrentPageError = currentPage
    ? checkDisplayPageError(currentPage)
    : false

  // Clean up when form is navigated away
  React.useEffect(() => {
    return () => {
      scrollingService.enableScrolling()
    }
  }, [])

  return {
    renderedPages,
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
