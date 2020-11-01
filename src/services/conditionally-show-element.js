// @flow
'use strict'

const fnMap = {
  '>': (lhs, rhs) => lhs > rhs,
  '>=': (lhs, rhs) => lhs >= rhs,
  '===': (lhs, rhs) => lhs === rhs,
  '!==': (lhs, rhs) => lhs !== rhs,
  '<=': (lhs, rhs) => lhs <= rhs,
  '<': (lhs, rhs) => lhs < rhs,
}

export const handleOptionsPredicate = (
  predicate /* : ConditionallyShowPredicateOptions */,
  model /* : { +[string]: mixed } */,
  predicateElement /* : FormElementWithOptions */,
) => {
  return predicate.optionIds.some((optionId) => {
    const option = predicateElement.options.find((o) => o.id === optionId)
    if (option) {
      if (Array.isArray(model[predicateElement.name])) {
        return model[predicateElement.name].some((modelValue) => {
          return modelValue === option.value
        })
      } else {
        return option.value === model[predicateElement.name]
      }
    } else {
      return false
    }
  })
}

const handlePredicate = (predicate, model, predicateElement) => {
  if (!predicateElement || predicateElement.type === 'page') {
    return false
  }
  switch (predicate.type) {
    case 'VALUE': {
      return !predicate.hasValue === !model[predicateElement.name]
    }
    case 'NUMERIC': {
      // $FlowFixMe
      const lhs = Number.parseFloat(model[predicateElement.name])
      const rhs =
        typeof predicate.value === 'string'
          ? Number.parseFloat(predicate.value)
          : predicate.value

      // if either of the values is not a number or the operator fn doesn't exist, hide the control
      const operatorFn = fnMap[predicate.operator]
      if (!operatorFn || Number.isNaN(lhs) || Number.isNaN(rhs)) return false

      return operatorFn(lhs, rhs)
    }
    case 'BETWEEN': {
      // $FlowFixMe
      const value = Number.parseFloat(model[predicateElement.name])
      if (Number.isNaN(value)) {
        return false
      }

      return value >= predicate.min && value <= predicate.max
    }
    case 'OPTIONS':
    default: {
      if (
        predicateElement.type !== 'select' &&
        predicateElement.type !== 'autocomplete' &&
        predicateElement.type !== 'radio' &&
        predicateElement.type !== 'checkboxes'
      ) {
        return false
      }

      // If the predicate element does not have any options to evaluate,
      // we will show the element.
      // Unless the predicate element is a has dynamic options and
      // options have not been fetched yet.
      if (!Array.isArray(predicateElement.options)) {
        return predicateElement.optionsType !== 'DYNAMIC'
      } else {
        return handleOptionsPredicate(predicate, model, predicateElement)
      }
    }
  }
}

const getPagesFormElementsCtrl = (
  formElementsCtrl /* : FormElementsCtrl */,
) /* : FormElementsCtrl */ => {
  if (formElementsCtrl.parentFormElementsCtrl) {
    return getPagesFormElementsCtrl(formElementsCtrl.parentFormElementsCtrl)
  }
  return formElementsCtrl
}

const conditionallyShowByPredicate = (
  formElementsCtrl,
  predicate,
  elementsEvaluated,
) => {
  const predicateElement = formElementsCtrl.elements.find((element) => {
    return element.id === predicate.elementId
  })

  // If we cant find the element used for the predicate,
  // we can check to see if the element being evaluated
  // is in a repeatable set and the predicate element is
  // in a parent list of elements.
  if (!predicateElement) {
    if (formElementsCtrl.parentFormElementsCtrl) {
      return conditionallyShowByPredicate(
        formElementsCtrl.parentFormElementsCtrl,
        predicate,
        elementsEvaluated,
      )
    } else {
      return false
    }
  }

  // Here we will also need to check if the predicate element
  // is on a page element and the page element is also hidden.
  // If it is hidden we will treat this predicate element as
  // hidden as well.
  const pagesFormElementCtrl = getPagesFormElementsCtrl(formElementsCtrl)
  const pageElement = pagesFormElementCtrl.elements.find((element) => {
    return (
      element.type === 'page' &&
      element.elements.some((e) => e.id === predicateElement.id)
    )
  })
  if (
    pageElement &&
    !conditionallyShowElement(formElementsCtrl, pageElement, [])
  ) {
    return false
  }

  // Check to see if the model has one of the valid values to show the element
  return (
    conditionallyShowElement(
      formElementsCtrl,
      predicateElement,
      elementsEvaluated,
    ) && handlePredicate(predicate, formElementsCtrl.model, predicateElement)
  )
}

export default function conditionallyShowElement(
  formElementsCtrl /* : FormElementsCtrl */,
  elementToEvaluate /* : FormElement */,
  elementsEvaluated /* : string[] */,
) /* : boolean */ {
  // If the element does not have the `conditionallyShow` flag set,
  // we can always show the element.
  if (
    !elementToEvaluate ||
    !elementToEvaluate.conditionallyShow ||
    !Array.isArray(elementToEvaluate.conditionallyShowPredicates) ||
    !elementToEvaluate.conditionallyShowPredicates.length
  ) {
    return true
  }
  const conditionallyShowPredicates =
    elementToEvaluate.conditionallyShowPredicates

  // Check to see if this element has already been used to evaluate
  // if the element should be shown based on parent element conditional logic
  if (
    elementsEvaluated.some((elementId) => elementId === elementToEvaluate.id)
  ) {
    throw new Error(
      'Your conditional logic has caused an infinite loop. Check the following Fields to ensure element A does not rely on element B if element B also relies on element A.',
    )
  } else {
    elementsEvaluated.push(elementToEvaluate.id)
  }

  const predicateFunction = (predicate) => {
    // Validate the predicate data, if it is invalid,
    // we will always show the field
    if (
      !predicate ||
      !predicate.elementId ||
      (predicate.type === 'OPTIONS' &&
        (!Array.isArray(predicate.optionIds) || !predicate.optionIds.length)) ||
      (predicate.type === 'NUMERIC' &&
        (Object.keys(fnMap).indexOf(predicate.operator) === -1 ||
          !Number.isFinite(predicate.value)))
    ) {
      return true
    }

    return conditionallyShowByPredicate(
      formElementsCtrl,
      predicate,
      elementsEvaluated,
    )
  }

  if (elementToEvaluate.requiresAllConditionallyShowPredicates) {
    return conditionallyShowPredicates.every(predicateFunction)
  } else {
    return conditionallyShowPredicates.some(predicateFunction)
  }
}
