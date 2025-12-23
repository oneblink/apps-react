import { FormTypes } from '@oneblink/types'
import { formStoreService } from '@oneblink/apps'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tooltip?: string
    formElementType?: FormTypes.FormElementType
    sorting:
      | {
          property: string
          direction: 'ascending' | 'descending' | undefined
        }
      | undefined
    filter?: {
      validationMessage?: string
      isInvalid?: boolean
      onChange: (
        newValue?: formStoreService.FormStoreFilter,
        shouldDebounce: boolean,
      ) => void
    } & (
      | {
          type: 'SUBMISSION_ID'
          value?: {
            $eq: string
          }
        }
      | {
          type: 'TEXT'
          value?: {
            $regex: string
            $options?: string
          }
        }
      | {
          type: 'DATETIME' | 'DATE'
          value?: {
            $gte?: string
            $lte?: string
          }
        }
      | {
          type: 'NUMBER'
          value?: {
            $gte?: number
            $lte?: number
          }
        }
      | {
          type: 'BOOLEAN'
          value?: {
            $eq: boolean
          }
        }
      | {
          type: 'OPTIONS_SINGLE'
          options: FormTypes.ChoiceElementOption[]
          value?: {
            $in: string[]
          }
        }
      | {
          type: 'OPTIONS_MULTIPLE'
          options: FormTypes.ChoiceElementOption[]
          value?: {
            $elemMatch: {
              $in: string[]
            }
          }
        }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    defaultHiddenColumnsVersion?: string
    formId
  }
}
