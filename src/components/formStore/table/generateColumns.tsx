import * as React from 'react'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { Column as ColumnWithCell, CellProps } from 'react-table'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import FormElementTableCell from './FormElementTableCell'
import { formStoreService } from '@oneblink/apps'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'

function generateSorting({
  formElement,
  parentElementNames,
  filters,
}: {
  formElement: FormTypes.FormElementWithName
  parentElementNames: string[]
  filters: formStoreService.FormStoreFilters
}) {
  switch (formElement.type) {
    case 'text':
    case 'textarea':
    case 'number':
    case 'email':
    case 'telephone':
    case 'barcodeScanner':
    case 'date':
    case 'datetime':
    case 'time':
    case 'calculation': {
      const sortProperty = [
        'submission',
        ...parentElementNames,
        formElement.name,
      ].join('.')
      return {
        property: sortProperty,
        direction: filters.sorting?.find(
          ({ property }) => property === sortProperty,
        )?.direction,
      }
    }
  }
}

function generateFilter({
  formElement,
  onChangeFilters,
  rootSubmissionFilters,
  parentElementNames,
}: {
  formElement: FormTypes.FormElementWithName
  onChangeFilters: OnChangeFilters<formStoreService.FormStoreFilters>
  rootSubmissionFilters: formStoreService.FormStoreFilters['submission']
  parentElementNames: string[]
}): ColumnWithCell<Record<string, unknown>>['filter'] {
  function onChange<T>(
    newValue: formStoreService.FormStoreFilter<T> | undefined,
    shouldDebounce: boolean,
  ) {
    onChangeFilters((currentFilters) => {
      let newSubmission = {
        [formElement.name]: newValue,
      }

      if (parentElementNames.length) {
        const copy = [...parentElementNames]
        while (copy.length) {
          const nestedSubmission = copy.reduce<
            formStoreService.FormStoreFilters['submission']
          >(
            (memo, elementName) =>
              memo?.[
                elementName
              ] as formStoreService.FormStoreFilters['submission'],
            rootSubmissionFilters,
          )
          const elementName = copy.pop()
          if (elementName) {
            newSubmission = {
              [elementName]: {
                ...nestedSubmission,
                ...newSubmission,
              },
            }
          }
        }
      }

      return {
        ...currentFilters,
        submission: {
          ...currentFilters.submission,
          ...newSubmission,
        },
      } as formStoreService.FormStoreFilters
    }, shouldDebounce)
  }

  const submissionFilters = parentElementNames.reduce<
    formStoreService.FormStoreFilters['submission']
  >(
    (memo, elementName) =>
      memo?.[elementName] as formStoreService.FormStoreFilters['submission'],
    rootSubmissionFilters,
  )
  switch (formElement.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'telephone':
    case 'barcodeScanner': {
      return {
        type: 'TEXT',
        value: submissionFilters?.[formElement.name] as
          | { $regex: string; $options?: string }
          | undefined,
        onChange,
      }
    }
    case 'number':
    case 'calculation': {
      return {
        type: 'NUMBER',
        value: submissionFilters?.[formElement.name] as
          | { $gte?: number; $lte?: number }
          | undefined,
        onChange,
      }
    }
    case 'checkboxes':
    case 'select':
    case 'radio':
    case 'autocomplete': {
      const value = submissionFilters?.[formElement.name]
      if (Array.isArray(formElement.options)) {
        if (
          (formElement.type === 'select' && formElement.multi) ||
          formElement.type === 'checkboxes'
        ) {
          return {
            type: 'OPTIONS_MULTIPLE',
            value: value as { $elemMatch: { $in: string[] } } | undefined,
            options: formElement.options,
            onChange,
          }
        } else {
          return {
            type: 'OPTIONS_SINGLE',
            value: value as { $in: string[] } | undefined,
            options: formElement.options,
            onChange,
          }
        }
      } else {
        return {
          type: 'TEXT',
          value: value as { $regex: string } | undefined,
          onChange,
        }
      }
    }
    case 'boolean':
      return {
        type: 'BOOLEAN',
        value: submissionFilters?.[formElement.name] as
          | { $eq: boolean }
          | undefined,
        onChange,
      }
    case 'date': {
      return {
        type: 'DATE',
        value: submissionFilters?.[formElement.name] as
          | { $gte?: string; $lte?: string }
          | undefined,
        onChange,
      }
    }
    case 'datetime':
      return {
        type: 'DATETIME',
        value: submissionFilters?.[formElement.name] as
          | { $gte?: string; $lte?: string }
          | undefined,
        onChange,
      }
    default: {
      return undefined
    }
  }
}

const generateColumns = <
  T extends { submission: FormStoreRecord['submission'] },
>({
  formElements,
  onChangeFilters,
  filters,
  parentElementNames,
  initialColumns,
  allowCopy,
}: {
  formElements: (FormTypes.FormElement & { tooltip?: string })[]
  onChangeFilters: OnChangeFilters<formStoreService.FormStoreFilters>
  filters: formStoreService.FormStoreFilters
  parentElementNames: string[]
  initialColumns: Array<ColumnWithCell<T>>
  allowCopy: boolean
}) => {
  return formElements.reduce<Array<ColumnWithCell<T>>>(
    (columns, formElement) => {
      switch (formElement.type) {
        case 'page':
        case 'section': {
          generateColumns({
            onChangeFilters,
            formElements: formElement.elements,
            parentElementNames,
            filters,
            initialColumns: columns,
            allowCopy,
          })
          break
        }
        case 'form': {
          if (formElement.elements) {
            generateColumns({
              onChangeFilters,
              formElements: formElement.elements,
              parentElementNames: [...parentElementNames, formElement.name],
              initialColumns: columns,
              filters,
              allowCopy,
            })
          }
          break
        }
        case 'compliance': {
          generateColumns({
            onChangeFilters,
            formElements: [
              {
                ...formElement,
                tooltip: formElement.name,
                type: 'radio',
                name: 'value',
                buttons: false,
              },
              {
                ...formElement,
                tooltip: `${formElement.name}_notes`,
                type: 'textarea',
                name: 'notes',
                label: `${formElement.label} (Notes)`,
              },
              {
                ...formElement,
                tooltip: `${formElement.name}_media`,
                type: 'files',
                restrictFileTypes: false,
                name: 'files',
                label: `${formElement.label} (Media)`,
              },
            ],
            parentElementNames: [...parentElementNames, formElement.name],
            initialColumns: columns,
            filters,
            allowCopy,
          })
          break
        }
        case 'summary':
        case 'captcha':
        case 'html':
        case 'heading':
        case 'infoPage':
        case 'image': {
          break
        }
        default: {
          columns.push({
            id: ['FORM_ELEMENT', ...parentElementNames, formElement.name].join(
              '_',
            ),
            sorting: generateSorting({
              formElement,
              filters,
              parentElementNames,
            }),
            headerText: formElement.label,
            tooltip: formElement.tooltip || formElement.name,
            filter: generateFilter({
              parentElementNames,
              formElement,
              onChangeFilters,
              rootSubmissionFilters: filters.submission,
            }),
            Cell: ({ row: { original: formStoreRecord } }: CellProps<T>) => {
              const submission = parentElementNames.reduce<
                SubmissionTypes.S3SubmissionData['submission']
              >(
                (memo, elementName) => memo?.[elementName],
                formStoreRecord.submission,
              )
              return (
                <FormElementTableCell
                  formElement={formElement}
                  submission={submission}
                  allowCopy={allowCopy}
                />
              )
            },
          })
          break
        }
      }
      return columns
    },
    initialColumns,
  )
}

export default generateColumns
