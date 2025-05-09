import ElementDOMId from './elementDOMIds'

/**
 * Recursively traverses ancestors to find the first visible ancestor element
 * and allow getting its scroll point. It handles the case of ancestor elements
 * being hidden by `is-hidden` or an ancestor section being collapsed.
 *
 * @param element - The element for which to find its first visible ancestor or
 *   ancestor sibling.
 * @returns A callback that returns the scroll point of the first visible
 *   ancestor element, or undefined if none is found.
 */
const findScrollPointOfVisibleAncestorElement = (
  element: HTMLElement,
): ((scrollableContainerId?: string) => number) | undefined => {
  const isVisible = element.checkVisibility()
  if (!isVisible) {
    const OBHiddenElement = element.closest('.is-hidden')
    if (OBHiddenElement && OBHiddenElement instanceof HTMLElement) {
      const parentOfHiddenElement = OBHiddenElement.parentElement
      if (
        !parentOfHiddenElement ||
        !(parentOfHiddenElement instanceof HTMLElement)
      ) {
        return
      }
      // In the case of a hidden ancestor element we will navigate to the bottom of the previous visible sibling.
      const parentIsVisible = parentOfHiddenElement.checkVisibility()
      if (!parentIsVisible) {
        if (OBHiddenElement.id === element.id) {
          // If the hidden element was not an ancestor, but instead the current element,
          // we need to go recursive with the parent instead of the same element
          return findScrollPointOfVisibleAncestorElement(
            OBHiddenElement.parentElement,
          )
        }
        return findScrollPointOfVisibleAncestorElement(OBHiddenElement)
      }
      let previousSibling = OBHiddenElement.previousElementSibling
      while (previousSibling && previousSibling instanceof HTMLElement) {
        if (previousSibling.checkVisibility()) {
          // Have to reasign for TS, because it does not recognise the typeguard in the `while` inside the callback function
          const sib = previousSibling
          return (scrollableContainerId?: string) => {
            if (scrollableContainerId) {
              return sib.offsetTop + sib.clientHeight
            }
            return sib.getBoundingClientRect().bottom
          }
        }
        previousSibling = previousSibling.previousElementSibling
      }
      // Revert to parent if no sibling is visible
      if (OBHiddenElement.parentElement instanceof HTMLElement) {
        return findScrollPointOfVisibleAncestorElement(
          OBHiddenElement.parentElement,
        )
      }
    }

    // Collapsed section ancestor
    const ancestorCollapsedSection = element.closest('.ob-section__collapsed')
    if (ancestorCollapsedSection) {
      const ancestorSectionRoot =
        ancestorCollapsedSection.closest('.ob-section')
      return ancestorSectionRoot && ancestorSectionRoot instanceof HTMLElement
        ? findScrollPointOfVisibleAncestorElement(ancestorSectionRoot)
        : undefined
    }

    // Not visible for some other reason
    return
  } else {
    return (scrollableContainerId?: string) => {
      if (scrollableContainerId) {
        let top = 0
        let el: HTMLElement | null = element
        while (el) {
          const offsetParent: Element | null = el.offsetParent
          if (offsetParent instanceof HTMLElement) {
            const offsetParentIsInsideScrollableContainer =
              offsetParent.closest(`#${scrollableContainerId}`)

            // Only process the offset of the current element if the offset parent
            // (offsetTop is derived from distance between element and top of `offsetParent)
            // is inside the scrollable container (or is the scrollable container).
            if (offsetParentIsInsideScrollableContainer) {
              top += el.offsetTop
              el = offsetParent
              continue
            }
          }
          el = null
        }
        return top
      }
      return element.getBoundingClientRect().top
    }
  }
}

const scrollToElement = ({
  elementDOMId,
  navigationTopOffset,
  scrollableContainerId,
}: {
  elementDOMId: ElementDOMId
  /** We allow an offset to cater for any headers */
  navigationTopOffset: number | 'CALCULATE'
  scrollableContainerId?: string
}) => {
  const element = document.getElementById(elementDOMId.elementContainerDOMId)
  if (element) {
    const getScrollPoint = findScrollPointOfVisibleAncestorElement(element)
    if (getScrollPoint) {
      window.requestAnimationFrame(() => {
        if (scrollableContainerId) {
          const scrollContainer = document.getElementById(scrollableContainerId)
          // Account for any top padding on the scrollable container
          const topPadding = parseFloat(
            scrollContainer
              ?.computedStyleMap()
              .get('padding-top')
              ?.toString() ?? '',
          )
          const scrollTo =
            getScrollPoint(scrollableContainerId) +
            topPadding -
            // We allow an offset to cater for any headers
            (typeof navigationTopOffset === 'number' ? navigationTopOffset : 0)
          scrollContainer?.scrollTo({
            top: scrollTo,
            behavior: 'smooth',
          })
          // We do not currently attempt to `CALCULATE` the top scroll offset for form containers,
          // as we have no guarantee that the container element is currently in the viewport, so this is more complicated.
        } else {
          const scrollTo =
            getScrollPoint() +
            window.scrollY -
            // We allow an offset to cater for any headers
            (typeof navigationTopOffset === 'number' ? navigationTopOffset : 0)
          window.scrollTo({
            top: scrollTo,
            behavior: 'smooth',
          })

          // Calculate Offset
          if (navigationTopOffset === 'CALCULATE') {
            const calculatedNavigationTopOffset =
              calculateDesiredOffsetAfterInitialScroll(element)
            if (calculatedNavigationTopOffset) {
              window.scrollTo({
                top: scrollTo - calculatedNavigationTopOffset,
                behavior: 'smooth',
              })
            }
          }
        }

        document.getElementById(elementDOMId.value)?.focus()
      })
    }
  }
}

export default scrollToElement

/**
 * Attempts to calculate the top scroll offset necessary to see the desired
 * element if it is being covered by any fixed, sticky or absolute elements,
 * after initial scroll.
 *
 * @param element - The element which we want to make visible. NOTE: This
 *   element should already be scrolled to the 0 `Y` co-ordinate of the viewport
 *   when calling this function for best results with sticky and absolute
 *   elements.
 * @returns A number that can be subtracted from the scroll point that would
 *   otherwise show the desired element at the 0 `Y` co-ordinate of the
 *   viewport.
 */
const calculateDesiredOffsetAfterInitialScroll = (element: HTMLElement) => {
  const elementLeft = element.getBoundingClientRect().left
  let offset = 0
  // Get element in the front-most position, right at the top of the page (where our element should be located currently)
  let elementFromPoint = document.elementFromPoint(elementLeft, offset)
  if (!elementFromPoint) {
    return offset
  }
  let position = window.getComputedStyle(elementFromPoint).position

  while (
    position === 'fixed' ||
    position === 'absolute' ||
    position === 'sticky'
  ) {
    // Get next elementFromPoint
    offset = elementFromPoint.getBoundingClientRect().bottom + 1
    elementFromPoint = document.elementFromPoint(elementLeft, offset)
    if (!elementFromPoint) {
      return offset
    }
    position = window.getComputedStyle(elementFromPoint).position
  }
  return offset
}
