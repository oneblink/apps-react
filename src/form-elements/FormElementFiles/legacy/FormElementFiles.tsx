import * as React from 'react'

import useBooleanState from '../../../hooks/useBooleanState'
import useIsMounted from '../../../hooks/useIsMounted'
import FileCard from '../../../components/renderer/attachments/FileCard'
import { downloadFileLegacy } from '../../../services/download-file'
import { FormTypes } from '@oneblink/types'
import Files from '../../../components/renderer/attachments/Files'
import {
  checkIfContentTypeIsImage,
  parseFilesAsAttachmentsLegacy,
} from '../../../services/attachments'
import { FormElementValueChangeHandler } from '../../../types/form'

export type FilesElementFile = {
  data: string
  fileName: string
}

type Props = {
  id: string
  element: FormTypes.FilesElement
  value: FilesElementFile[] | undefined
  onChange: FormElementValueChangeHandler<FilesElementFile[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

type ChildProps = {
  element: FormTypes.FilesElement
  onRemove: (index: number) => unknown
  file: FilesElementFile
  index: number
}

const FormElementFile = ({ element, onRemove, file, index }: ChildProps) => {
  const isImageType = React.useMemo(() => {
    const matches = file.data.match(/data:(\w*\/\w*);base64/)
    if (!matches) {
      return false
    }
    return checkIfContentTypeIsImage(matches[1])
  }, [file.data])
  const handleRemove = React.useCallback(
    () => onRemove(index),
    [index, onRemove],
  )
  const handleDownload = React.useCallback(async () => {
    await downloadFileLegacy(file.data, file.fileName)
  }, [file])

  return (
    <FileCard
      element={element}
      imageUrl={isImageType ? file.data : null}
      fileName={file.fileName}
      onDownload={handleDownload}
      onRemove={handleRemove}
    />
  )
}

const MemorisedFile = React.memo(FormElementFile)

function FormElementFiles({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)
  const isMounted = useIsMounted()

  const addFile = React.useCallback(
    async (newFiles) => {
      const attachments = await parseFilesAsAttachmentsLegacy(newFiles)
      if (!attachments.length) {
        return
      }

      onChange(element, (existingAttachments) => {
        if (!existingAttachments) {
          return attachments
        }
        return [...existingAttachments, ...attachments]
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const handleRemove = React.useCallback(
    (index: number) => {
      onChange(element, (existingValue) => {
        if (!existingValue) {
          return
        }
        const newValue = existingValue.filter((file, i) => i !== index)
        if (newValue.length) {
          return newValue
        }
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const handleRenderAttachment = React.useCallback(
    (attachment, index) => {
      return (
        <MemorisedFile
          key={index}
          element={element}
          onRemove={handleRemove}
          file={attachment}
          index={index}
        />
      )
    },
    [element, handleRemove],
  )

  return (
    <Files
      id={id}
      element={element}
      isDirty={isDirty}
      attachments={value || []}
      displayValidationMessage={displayValidationMessage}
      validationMessage={validationMessage}
      onAddFiles={addFile}
      onRenderAttachment={handleRenderAttachment}
    />
  )
}

export default React.memo(FormElementFiles)
