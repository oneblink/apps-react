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
  element: Element,
): (() => number) | undefined => {
  const isVisible = element.checkVisibility()
  if (!isVisible) {
    const OBHiddenElement = element.closest('.is-hidden')

    if (OBHiddenElement) {
      // In the case of a hidden ancestor element we will navigate to the bottom of the previous visible sibling.
      const parentIsVisible = OBHiddenElement.parentElement?.checkVisibility()
      if (!parentIsVisible) {
        return findScrollPointOfVisibleAncestorElement(OBHiddenElement)
      }
      let previousSibling = OBHiddenElement.previousElementSibling
      while (previousSibling) {
        if (previousSibling.checkVisibility()) {
          // Have to reasign for TS, because it does not recognise the typeguard in the `while` inside the callback function
          const sib = previousSibling
          return () => sib.getBoundingClientRect().bottom
        }
        previousSibling = previousSibling.previousElementSibling
      }
    }

    // Collapsed section ancestor
    const ancestorCollapsedSection = element.closest('.ob-section__collapsed')
    if (ancestorCollapsedSection) {
      const ancestorSectionRoot =
        ancestorCollapsedSection.closest('.ob-section')
      return ancestorSectionRoot
        ? findScrollPointOfVisibleAncestorElement(ancestorSectionRoot)
        : undefined
    }

    // Not visible for some other reason
    return
  } else {
    return () => element.getBoundingClientRect().top
  }
}

const scrollToElement = ({
  id,
  navigationTopOffset,
}: {
  id: string
  /** We allow an offset to cater for any headers */
  navigationTopOffset: number
}) => {
  const element = document.getElementById(id)

  if (element) {
    const getScrollPoint = findScrollPointOfVisibleAncestorElement(element)
    if (getScrollPoint) {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top:
            getScrollPoint() +
            window.scrollY -
            // We allow an offset to cater for any headers
            navigationTopOffset,
          behavior: 'smooth',
        })
      })
    }
  }
}

export default scrollToElement
