import { FormTypes } from '@oneblink/types'

export type FormElementWithDynamicElement = FormTypes.FormElement & {
  isDynamicElement?: boolean
}
