import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import useBooleanState from '../hooks/useBooleanState'
import scrollingService from '../services/scrolling-service'

export default function usePages({
  pages,
  pagesValidation,
  pageElementsConditionallyShown,
}: {
  pages: FormTypes.PageElement[]
  pagesValidation: PageElementsValidation | undefined
  pageElementsConditionallyShown: PageElementsConditionallyShown
}) {
  const [visitedPageIds, setVisitedPageIds] = React.useState<string[]>([])

  const [
    isStepsHeaderActive,
    ,
    closeStepsNavigation,
    toggleStepsNavigation,
  ] = useBooleanState(false)

  const visiblePages = React.useMemo<FormTypes.PageElement[]>(() => {
    return pages.filter((pageElement) => {
      return (
        pageElementsConditionallyShown[pageElement.id] &&
        pageElementsConditionallyShown[pageElement.id].isShown
      )
    })
  }, [pageElementsConditionallyShown, pages])

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

  const setPageId = React.useCallback(
    (pageId: string) => {
      setVisitedPageIds((currentVisitedPageIds) => {
        if (currentVisitedPageIds.includes(currentPageId)) {
          return currentVisitedPageIds
        } else {
          return [...currentVisitedPageIds, currentPageId]
        }
      })
      if (window.scrollTo) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        })
      }
      setCurrentPageId(pageId)
      closeStepsNavigation()
    },
    [closeStepsNavigation, currentPageId],
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
    (page /* : PageElement */) => {
      // If we have not visited the page yet, we will not display errors
      if (!visitedPageIds.includes(page.id)) {
        return false
      }

      // If there is no page validation, we will treat as valid
      return !!pagesValidation && !!pagesValidation[page.id]
    },
    [pagesValidation, visitedPageIds],
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
        })
      }
    } else {
      // Re-enable scroll on body when inactive
      scrollingService.enableScrolling()
    }
  }, [currentPageId, isStepsHeaderActive])

  const firstVisiblePage = visiblePages[0]
  const lastVisiblePage = visiblePages[visiblePages.length - 1]
  const isShowingMultiplePages = visiblePages.length > 1
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
  }
}
