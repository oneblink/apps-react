/**
 * Recursively traverses ancestors to find the first visible ancestor element
 * and allow getting its scroll point. It handles the case of ancestor elements
 * being hidden by `ob-hidden` or an ancestor section being collapsed.
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
  id,
  navigationTopOffset,
  scrollableContainerId,
}: {
  id: string
  /** We allow an offset to cater for any headers */
  navigationTopOffset: number
  scrollableContainerId?: string
}) => {
  const element = document.getElementById(id)
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
          scrollContainer?.scrollTo({
            top:
              getScrollPoint(scrollableContainerId) +
              topPadding -
              // We allow an offset to cater for any headers
              navigationTopOffset,
            behavior: 'smooth',
          })
        } else {
          window.scrollTo({
            top:
              getScrollPoint() +
              window.scrollY -
              // We allow an offset to cater for any headers
              navigationTopOffset,
            behavior: 'smooth',
          })
        }
      })
    }
  }
}

export default scrollToElement
