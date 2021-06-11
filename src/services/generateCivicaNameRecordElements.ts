import { v4 as uuid } from 'uuid'
import { FormTypes } from '@oneblink/types'

const createFormElement = () => ({
  id: uuid(),
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
})

function generateCivicaNameRecordAddressElements(
  element: FormTypes.CivicaNameRecordElement,
): FormTypes.FormElement[] {
  if (element.useGeoscapeAddressing) {
    return [
      {
        ...createFormElement(),
        type: 'geoscapeAddress',
        name: 'address1',
        label: 'Address',
        required: element.required,
        readOnly: element.readOnly,
      },
    ]
  }
  return [
    {
      ...createFormElement(),
      type: 'text',
      name: 'address1',
      label: 'Address',
      required: element.required,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'address2',
      label: 'Suburb',
      required: element.required,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'postcode',
      label: 'Postcode',
      required: element.required,
      readOnly: element.readOnly,
    },
  ]
}

export default function generateCivicaNameRecordElements(
  element: FormTypes.CivicaNameRecordElement,
  titleCodeOptions?: FormTypes.ChoiceElementOption[],
): FormTypes.FormElement[] {
  return [
    {
      ...createFormElement(),
      type: titleCodeOptions ? 'select' : 'text',
      name: 'title',
      label: 'Title',
      required: element.required,
      readOnly: element.readOnly,
      optionsType: 'CUSTOM',
      options: titleCodeOptions || [],
      multi: false,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'givenName1',
      label: 'First Name',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'familyName',
      label: 'Last Name',
      required: element.required,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'email',
      name: 'emailAddress',
      label: 'Email Address',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'homePhone',
      label: 'Home Phone Number',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'businessPhone',
      label: 'Business Phone Number',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'mobilePhone',
      label: 'Mobile Number',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'faxPhone',
      label: 'Fax Number',
      required: false,
      readOnly: element.readOnly,
    },
    {
      ...createFormElement(),
      type: 'repeatableSet',
      name: 'streetAddress',
      label: 'Street Addresses',
      minSetEntries: element.required ? 1 : undefined,
      readOnly: element.readOnly,
      elements: generateCivicaNameRecordAddressElements(element),
    },
  ]
}
