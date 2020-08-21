// @flow
'use strict'

const overflowClass = 'overflow-hidden'
let isDisabled = false

function elementOrAncestorHasClass(element, className) {
  if (!element || element === document) {
    return false
  }

  if (element.className.indexOf(className) >= 0) {
    return true
  }

  return elementOrAncestorHasClass(element.parentNode, className)
}

function preventDefault(e) {
  if (!elementOrAncestorHasClass(e.target, 'modal')) {
    e.preventDefault()
  }
}

function disableScrolling() {
  if (isDisabled) {
    return
  }
  isDisabled = true

  // $FlowFixMe
  document.body.parentNode.classList.add(overflowClass)
  // $FlowFixMe
  document
    .querySelector('.main-view')
    // $FlowFixMe
    .addEventListener('touchmove', preventDefault, false)
}

function enableScrolling() {
  if (!isDisabled) {
    return
  }
  isDisabled = false

  // $FlowFixMe
  document.body.parentNode.classList.remove(overflowClass)
  // $FlowFixMe
  document
    .querySelector('.main-view')
    // $FlowFixMe
    .removeEventListener('touchmove', preventDefault, false)
}

export default {
  disableScrolling,
  enableScrolling,
}
