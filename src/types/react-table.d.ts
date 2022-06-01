import { FormTypes } from '@oneblink/types'
import {
  UseResizeColumnsColumnProps,
  UseResizeColumnsOptions,
  UseResizeColumnsState,
} from 'react-table'
import { formStoreService } from '@oneblink/apps'

declare module 'react-table' {
  export interface UseTableColumnOptions<
    D extends Record<string, unknown> = Record<string, unknown>,
  > {
    headerText: string
    tooltip?: string
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
          options: FormTypes.DynamicChoiceElementOption[]
          value?: {
            $in: string[]
          }
        }
      | {
          type: 'OPTIONS_MULTIPLE'
          options: FormTypes.DynamicChoiceElementOption[]
          value?: {
            $elemMatch: {
              $in: string[]
            }
          }
        }
    )
    formElementType?: FormTypes.FormElementType
  }

  export interface ColumnInstance<
    D extends Record<string, unknown> = Record<string, unknown>,
  > extends UseResizeColumnsColumnProps<D> {}

  export interface TableState<
    D extends Record<string, unknown> = Record<string, unknown>,
  > extends UseResizeColumnsState<D> {}

  export interface TableOptions<
    D extends Record<string, unknown> = Record<string, unknown>,
  > extends UseResizeColumnsOptions<D> {}
}
