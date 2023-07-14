import { v4 as uuid } from 'uuid'
import { FormTypes } from '@oneblink/types'

const createFormElement = () => ({
  id: uuid(),
  type: 'select' as const,
  multi: false,
  optionsType: 'FRESHDESK_FIELD' as const,
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
  required: false,
  requiresAllConditionallyShowPredicates: false,
})

export function getNestedOptions(
  parentOptions: FormTypes.ChoiceElementOption[] | undefined,
  parentValue: string | undefined,
): FormTypes.ChoiceElementOption[] | undefined {
  const selectedParentOption = parentOptions?.find(
    (parentOption) => parentOption.value === parentValue,
  )
  if (parentOptions) {
    if (selectedParentOption) {
      return selectedParentOption.options as FormTypes.ChoiceElementOption[]
    } else {
      return parentOptions.reduce<FormTypes.ChoiceElementOption[]>(
        (memo, option) => [
          ...memo,
          ...((option.options || []) as FormTypes.ChoiceElementOption[]),
        ],
        [],
      )
    }
  }
  return undefined
}

export default function generateFreshdeskDependentFieldElements(
  element: FormTypes.FreshdeskDependentFieldElement,
): FormTypes.SelectElement[] {
  const categoryElement: FormTypes.SelectElement = {
    ...createFormElement(),
    name: 'category',
    required: element.required,
    readOnly: element.readOnly,
    label: element.label,
    hint: element.hint,
    defaultValue: element.defaultValue?.category,
    options: element.options,
    freshdeskFieldName: element.freshdeskFieldName,
    optionsType: 'FRESHDESK_FIELD',
  }
  const formElements = [categoryElement]

  const subCategoryElement: FormTypes.SelectElement = {
    ...createFormElement(),
    name: 'subCategory',
    required: element.required,
    readOnly: element.readOnly,
    label: element.subCategoryLabel,
    hint: element.subCategoryHint,
    defaultValue: element.defaultValue?.subCategory,
    options: [],
  }
  formElements.push(subCategoryElement)

  const itemElement: FormTypes.SelectElement = {
    ...createFormElement(),
    name: 'item',
    required: element.required,
    readOnly: element.readOnly,
    label: element.itemLabel,
    hint: element.itemHint,
    defaultValue: element.defaultValue?.item,
    options: [],
  }
  formElements.push(itemElement)

  return formElements
}
