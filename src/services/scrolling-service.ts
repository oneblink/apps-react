const overflowClass = 'overflow-hidden'
let isDisabled = false

function elementOrAncestorHasClass(element: any, className: any): boolean {
  if (!element || element === document) {
    return false
  }

  if (element.className.indexOf(className) >= 0) {
    return true
  }

  return elementOrAncestorHasClass(element.parentNode, className)
}

function preventDefault(e: any) {
  if (!elementOrAncestorHasClass(e.target, 'modal')) {
    e.preventDefault()
  }
}

function disableScrolling() {
  if (isDisabled) {
    return
  }
  isDisabled = true

  // @ts-ignore
  document.body.parentNode.classList.add(overflowClass)
  // @ts-ignore
  document.body.addEventListener('touchmove', preventDefault, false)
}

function enableScrolling() {
  if (!isDisabled) {
    return
  }
  isDisabled = false

  // @ts-ignore
  document.body.parentNode.classList.remove(overflowClass)
  // @ts-ignore
  document.body.removeEventListener('touchmove', preventDefault, false)
}

export default {
  disableScrolling,
  enableScrolling,
}
