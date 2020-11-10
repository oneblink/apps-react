const overflowClass = 'overflow-hidden'
let isDisabled = false

function elementOrAncestorHasClass(element: any, className: string): boolean {
  if (!element || element === document) {
    return false
  }

  if (element.className.indexOf(className) >= 0) {
    return true
  }

  return elementOrAncestorHasClass(element.parentNode, className)
}

function preventDefault(e: TouchEvent) {
  if (!elementOrAncestorHasClass(e.target, 'modal')) {
    e.preventDefault()
  }
}

function disableScrolling(): void {
  if (isDisabled) {
    return
  }
  isDisabled = true

  // @ts-expect-error ???
  document.body.parentNode.classList.add(overflowClass)
  document.body.addEventListener('touchmove', preventDefault, false)
}

function enableScrolling(): void {
  if (!isDisabled) {
    return
  }
  isDisabled = false

  // @ts-expect-error ???
  document.body.parentNode.classList.remove(overflowClass)
  document.body.removeEventListener('touchmove', preventDefault, false)
}

export default {
  disableScrolling,
  enableScrolling,
}
