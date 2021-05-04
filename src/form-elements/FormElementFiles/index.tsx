import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementFilesLegacy, {
  FilesElementFile,
} from './legacy/FormElementFiles'
import FormElementFiles from './FormElementFiles'
import {
  Attachment,
  OnChangeAttachments,
} from '../../hooks/attachments/useAttachments'
export type PossibleFileConfiguration = Attachment | FilesElementFile
interface Props {
  id: string
  element: FormTypes.FilesElement
  value: unknown
  onChange: OnChangeSubmission
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

const FormElementFilesController = ({ value, onChange, ...props }: Props) => {
  if (!props.element.storageType || props.element.storageType === 'legacy') {
    return (
      <FormElementFilesLegacy
        value={value as FilesElementFile[] | undefined}
        onChange={onChange as OnChangeAttachments<FilesElementFile[]>}
        {...props}
      />
    )
  }
  return (
    <FormElementFiles
      value={value as Attachment[] | undefined}
      onChange={onChange as OnChangeAttachments<Attachment[]>}
      {...props}
    />
  )
}

export default React.memo<Props>(FormElementFilesController)
