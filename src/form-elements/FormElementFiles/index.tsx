import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementFilesLegacy, {
  FilesElementFile,
} from './legacy/FormElementFiles'
import FormElementFiles from './FormElementFiles'
import { Attachment } from '../../types/attachments'
import { checkIsUsingLegacyStorage } from '../../services/attachments'
import { FormElementValueChangeHandler } from '../../types/form'
export type PossibleFileConfiguration = Attachment | FilesElementFile
interface Props {
  id: string
  element: FormTypes.FilesElement
  value: unknown
  onChange: FormElementValueChangeHandler
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

export function stringifyAttachments(value: Attachment[] | undefined): string {
  if (value?.every((attachment) => !attachment.type)) {
    return JSON.stringify(value)
  }
  return ''
}

const FormElementFilesController = ({ value, onChange, ...props }: Props) => {
  if (checkIsUsingLegacyStorage(props.element)) {
    return (
      <FormElementFilesLegacy
        value={value as FilesElementFile[] | undefined}
        onChange={onChange as FormElementValueChangeHandler<FilesElementFile[]>}
        {...props}
      />
    )
  }
  return (
    <FormElementFiles
      value={value as Attachment[] | undefined}
      onChange={onChange as FormElementValueChangeHandler<Attachment[]>}
      {...props}
    />
  )
}

export default React.memo<Props>(FormElementFilesController)
