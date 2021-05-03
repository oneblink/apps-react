import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementFilesLegacy, {
  FilesElementFile,
} from './legacy/FormElementFiles'
import FormElementFiles from './FormElementFiles'
import { FileConfiguration } from '../../hooks/useAttachments'
export type PossibleFileConfiguration = FilesElementFile | FileConfiguration
interface Props {
  id: string
  element: FormTypes.FilesElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: PossibleFileConfiguration[],
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

const FormElementFilesController = ({ value, onChange, ...props }: Props) => {
  if (!props.element.storageType || props.element.storageType === 'legacy') {
    console.log('Using legacy files...')
    return (
      <FormElementFilesLegacy
        value={value as FilesElementFile[] | undefined}
        onChange={
          onChange as (
            formElement: FormTypes.FormElement,
            newValue: FilesElementFile[],
          ) => unknown
        }
        {...props}
      />
    )
  }
  console.log('Using new files...')
  return (
    <FormElementFiles
      value={value as FileConfiguration[] | undefined}
      onChange={
        onChange as (
          formElement: FormTypes.FormElement,
          newValue: FileConfiguration[],
        ) => unknown
      }
      {...props}
    />
  )
}

export default React.memo<Props>(FormElementFilesController)
