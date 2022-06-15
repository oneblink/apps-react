import * as React from 'react'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { Column as ColumnWithCell, CellProps } from 'react-table'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import FormElementTableCell from './FormElementTableCell'
import { formStoreService } from '@oneblink/apps'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'
import generateFreshdeskDependentFieldElements from '../../../services/generateFreshdeskDependentFieldElements'

function generateSorting({
  formElement,
  parentElementNames,
  sorting,
}: {
  formElement: FormTypes.FormElementWithName
  parentElementNames: string[]
  sorting: formStoreService.FormStoreParameters['sorting']
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
        direction: sorting?.find(({ property }) => property === sortProperty)
          ?.direction,
      }
    }
  }
}

function generateFilter({
  formElement,
  onChangeParameters,
  rootSubmissionFilters,
  parentElementNames,
}: {
  formElement: FormTypes.FormElementWithName
  onChangeParameters: OnChangeFilters<formStoreService.FormStoreParameters>
  rootSubmissionFilters: formStoreService.FormStoreFilters['submission']
  parentElementNames: string[]
}): ColumnWithCell<Record<string, unknown>>['filter'] {
  function onChange<T>(
    newValue: formStoreService.FormStoreFilter<T> | undefined,
    shouldDebounce: boolean,
  ) {
    onChangeParameters((currentParameters) => {
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
        ...currentParameters,
        filters: {
          ...currentParameters.filters,
          submission: {
            ...currentParameters.filters?.submission,
            ...newSubmission,
          },
        },
      }
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
  onChangeParameters,
  filters,
  sorting,
  unwindRepeatableSets,
  parentElementNames,
  initialColumns,
  allowCopy,
}: {
  formElements: (FormTypes.FormElement & { tooltip?: string })[]
  onChangeParameters: OnChangeFilters<formStoreService.FormStoreParameters>
  parentElementNames: string[]
  initialColumns: Array<ColumnWithCell<T>>
  allowCopy: boolean
} & {
  [P in keyof Required<formStoreService.FormStoreParameters>]:
    | formStoreService.FormStoreParameters[P]
    | undefined
}) => {
  return formElements.reduce<Array<ColumnWithCell<T>>>(
    (columns, formElement) => {
      if (unwindRepeatableSets && formElement.type === 'repeatableSet') {
        generateColumns({
          onChangeParameters,
          formElements: formElement.elements,
          parentElementNames: [...parentElementNames, formElement.name],
          initialColumns: columns,
          filters,
          allowCopy,
          sorting,
          unwindRepeatableSets,
        })
        return columns
      }
      switch (formElement.type) {
        case 'page':
        case 'section': {
          generateColumns({
            onChangeParameters,
            formElements: formElement.elements,
            parentElementNames,
            filters,
            initialColumns: columns,
            allowCopy,
            sorting,
            unwindRepeatableSets,
          })
          break
        }
        case 'form': {
          if (formElement.elements) {
            generateColumns({
              onChangeParameters,
              formElements: formElement.elements,
              parentElementNames: [...parentElementNames, formElement.name],
              initialColumns: columns,
              filters,
              allowCopy,
              sorting,
              unwindRepeatableSets,
            })
          }
          break
        }
        case 'compliance': {
          generateColumns({
            onChangeParameters,
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
            sorting,
            unwindRepeatableSets,
          })
          break
        }
        case 'freshdeskDependentField': {
          const [categoryFormElement, subCategoryFormElement, itemFormElement] =
            generateFreshdeskDependentFieldElements(
              formElement,
              formElement.defaultValue,
            )
          generateColumns({
            onChangeParameters,
            formElements: [
              {
                ...categoryFormElement,
                tooltip: `${formElement.name}_category`,
              },
              {
                ...subCategoryFormElement,
                tooltip: `${formElement.name}_sub_category`,
              },
              {
                ...itemFormElement,
                tooltip: `${formElement.name}_item`,
              },
            ],
            parentElementNames: [...parentElementNames, formElement.name],
            initialColumns: columns,
            filters,
            allowCopy,
            sorting,
            unwindRepeatableSets,
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
            formElementType: formElement.type,
            id: ['FORM_ELEMENT', ...parentElementNames, formElement.name].join(
              '_',
            ),
            sorting: generateSorting({
              formElement,
              sorting,
              parentElementNames,
            }),
            headerText: formElement.label,
            tooltip: formElement.tooltip || formElement.name,
            filter: generateFilter({
              parentElementNames,
              formElement,
              onChangeParameters,
              rootSubmissionFilters: filters?.submission,
            }),
            Cell: ({ row: { original: formStoreRecord } }: CellProps<T>) => {
              const submission = parentElementNames.reduce<
                SubmissionTypes.S3SubmissionData['submission']
              >(
                (memo, elementName) =>
                  memo?.[elementName] as FormStoreRecord['submission'],
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
