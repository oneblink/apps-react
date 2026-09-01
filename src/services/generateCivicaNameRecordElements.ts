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
        label: element.address1Label || 'Address',
        required: element.required,
      },
    ]
  }
  return [
    {
      ...createFormElement(),
      type: 'text',
      name: 'address1',
      label: element.address1Label || 'Address 1',
      required: element.required,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'address2',
      label: element.address2Label || 'Address 2',
      required: element.required,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'postcode',
      label: element.postcodeLabel || 'Postcode',
      required: element.required,
    },
  ]
}

export default function generateCivicaNameRecordElements(
  element: FormTypes.CivicaNameRecordElement,
  titleCodeOptions?: FormTypes.ChoiceElementOption[],
): FormTypes.FormElementWithName[] {
  const elementsWithHidden: Array<
    FormTypes.FormElementWithName & { civicaIsHidden?: boolean }
  > = [
    {
      ...createFormElement(),
      type: titleCodeOptions ? 'select' : 'text',
      name: 'title',
      label: element.titleLabel || 'Title',
      required: element.required,
      optionsType: 'CUSTOM',
      options: titleCodeOptions || [],
      multi: false,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'givenName1',
      label: element.givenName1Label || 'Given Name 1',
      required: !!element.givenName1IsRequired,
      civicaIsHidden: element.givenName1IsHidden,
    },
    {
      ...createFormElement(),
      type: 'text',
      name: 'familyName',
      label: element.familyNameLabel || 'Family Name',
      required: element.required,
    },
    {
      ...createFormElement(),
      type: 'email',
      name: 'emailAddress',
      label: element.emailAddressLabel || 'Email Address',
      required: !!element.emailAddressIsRequired,
      civicaIsHidden: element.emailAddressIsHidden,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'homePhone',
      label: element.homePhoneLabel || 'Home Phone',
      required: !!element.homePhoneIsRequired,
      civicaIsHidden: element.homePhoneIsHidden,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'businessPhone',
      label: element.businessPhoneLabel || 'Business Phone',
      required: !!element.businessPhoneIsRequired,
      civicaIsHidden: element.businessPhoneIsHidden,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'mobilePhone',
      label: element.mobilePhoneLabel || 'Mobile Phone',
      required: !!element.mobilePhoneIsRequired,
      civicaIsHidden: element.mobilePhoneIsHidden,
    },
    {
      ...createFormElement(),
      type: 'telephone',
      name: 'faxPhone',
      label: element.faxPhoneLabel || 'Fax Phone',
      required: !!element.faxPhoneIsRequired,
      civicaIsHidden: element.faxPhoneIsHidden,
    },
    {
      ...createFormElement(),
      type: 'repeatableSet',
      name: 'streetAddress',
      label: element.streetAddressesLabel || 'Street Addresses',
      minSetEntries: element.required ? 1 : undefined,
      elements: generateCivicaNameRecordAddressElements(element),
    },
  ]
  return elementsWithHidden
    .filter((ele) => !ele.civicaIsHidden)
    .map((ele) => {
      delete ele.civicaIsHidden
      return ele
    })
}
