import { FormTypes, ConditionTypes } from '@oneblink/types'
import { conditionalLogicService } from '@oneblink/sdk-core'
import { FormSubmissionModel } from '../types/form'

export type FormElementsCtrl = {
  model: FormSubmissionModel
  flattenedElements: import('@oneblink/types').FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
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
    ) &&
    conditionalLogicService.evaluateConditionalPredicate({
      predicate,
      submission: formElementsCtrl.model,
      predicateElement,
    })
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
