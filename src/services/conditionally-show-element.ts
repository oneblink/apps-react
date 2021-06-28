import { FormTypes, ConditionTypes } from '@oneblink/types'
import { FormSubmissionModel } from '../types/form'

const fnMap = {
  '>': (lhs: number, rhs: number) => lhs > rhs,
  '>=': (lhs: number, rhs: number) => lhs >= rhs,
  '===': (lhs: number, rhs: number) => lhs === rhs,
  '!==': (lhs: number, rhs: number) => lhs !== rhs,
  '<=': (lhs: number, rhs: number) => lhs <= rhs,
  '<': (lhs: number, rhs: number) => lhs < rhs,
}

export type FormElementsCtrl = {
  model: FormSubmissionModel
  flattenedElements: import('@oneblink/types').FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}

export const handleOptionsPredicate = (
  predicate: ConditionTypes.ConditionalPredicateOptions,
  model: FormSubmissionModel,
  predicateElement: FormTypes.FormElementWithOptions,
) => {
  return predicate.optionIds.some((optionId) => {
    const option = predicateElement.options.find((o) => o.id === optionId)
    if (option) {
      const value = model[predicateElement.name]
      if (Array.isArray(value)) {
        return value.some((modelValue) => {
          return modelValue === option.value
        })
      } else if (predicateElement.type === 'compliance' && value) {
        return option.value === (value as { value: unknown }).value
      } else {
        return option.value === value
      }
    } else {
      return false
    }
  })
}

const handlePredicate = (
  predicate: ConditionTypes.ConditionalPredicate,
  model: FormSubmissionModel,
  predicateElement: FormTypes.FormElement,
) => {
  if (
    !predicateElement ||
    predicateElement.type === 'page' ||
    predicateElement.type === 'section'
  ) {
    return false
  }
  switch (predicate.type) {
    case 'VALUE': {
      return !predicate.hasValue === !model[predicateElement.name]
    }
    case 'NUMERIC': {
      // @ts-expect-error ???
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
      // @ts-expect-error ???
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
        predicateElement.type !== 'checkboxes' &&
        predicateElement.type !== 'compliance'
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

const getParentFormElements = (
  formElementsCtrl: FormElementsCtrl,
  childElement: FormTypes.FormElement,
): Array<FormTypes.SectionElement | FormTypes.PageElement> => {
  const parentElement = formElementsCtrl.flattenedElements.find((element) => {
    return (
      (element.type === 'page' || element.type === 'section') &&
      element.elements.some(({ id }) => id === childElement.id)
    )
  })
  if (
    parentElement &&
    (parentElement.type === 'page' || parentElement.type === 'section')
  ) {
    return [
      parentElement,
      ...getParentFormElements(formElementsCtrl, parentElement),
    ]
  }
  return []
}

const conditionallyShowByPredicate = (
  formElementsCtrl: FormElementsCtrl,
  predicate: ConditionTypes.ConditionalPredicate,
  elementsEvaluated: Array<{ id: string; label: string }>,
): FormTypes.FormElement | boolean => {
  const predicateElement = formElementsCtrl.flattenedElements.find(
    (element: FormTypes.FormElement) => {
      return element.id === predicate.elementId
    },
  )

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
  // is on a page/section element and the page/section element
  // is also hidden. If it is hidden we will treat this
  // predicate element as hidden as well.
  const parentFormElements = getParentFormElements(
    formElementsCtrl,
    predicateElement,
  )
  for (const parentFormElement of parentFormElements) {
    if (
      !conditionallyShowElement(formElementsCtrl, parentFormElement, [
        ...elementsEvaluated,
      ])
    ) {
      return false
    }
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
  formElementsCtrl: FormElementsCtrl,
  elementToEvaluate: FormTypes.FormElement,
  elementsEvaluated: Array<{ id: string; label: string }>,
): boolean {
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
  const elementAlreadyEvaluated = elementsEvaluated.find(
    ({ id }) => id === elementToEvaluate.id,
  )
  if (elementAlreadyEvaluated) {
    throw new Error(
      `Your conditional logic has caused an infinite loop. Check the "${elementAlreadyEvaluated.label}" form element to ensure element A does not rely on element B if element B also relies on element A.`,
    )
  } else {
    elementsEvaluated.push({
      id: elementToEvaluate.id,
      label:
        elementToEvaluate.type === 'form' ||
        elementToEvaluate.type === 'infoPage'
          ? elementToEvaluate.name
          : elementToEvaluate.label,
    })
  }

  const predicateFunction = (
    predicate: ConditionTypes.ConditionalPredicate,
  ) => {
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

    // Spread the array of elements evaluated so that each predicate can
    // evaluate the tree without causing false positives for infinite
    // loop conditional logic
    return conditionallyShowByPredicate(formElementsCtrl, predicate, [
      ...elementsEvaluated,
    ])
  }

  if (elementToEvaluate.requiresAllConditionallyShowPredicates) {
    return conditionallyShowPredicates.every(predicateFunction)
  } else {
    return conditionallyShowPredicates.some(predicateFunction)
  }
}
