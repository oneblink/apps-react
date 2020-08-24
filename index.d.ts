import * as React from 'react'
import { FormTypes } from '@oneblink/apps'
import { FormElementsCtrl } from './typescript/types/form'
interface OneBlinkFormProps {
  formsAppId: number
  form: FormTypes.Form
  isPreview?: boolean
  initialSubmission: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  captchaSiteKey?: string
  onCancel: () => unknown
  onSubmit: (formSubmission: FormTypes.FormSubmission) => unknown
  onSaveDraft?: (draftSubmission: FormTypes.DraftSubmission) => unknown
  onChange?: (model: FormElementsCtrl['model']) => unknown
}
declare const OneBlinkForm: React.FunctionComponent<OneBlinkFormProps>

type OneBlinkAutoSaveFormProps = OneBlinkFormProps & {
  autoSaveKey?: string
}
declare const OneBlinkAutoSaveForm: React.FunctionComponent<OneBlinkAutoSaveFormProps>

declare const useBooleanState: (
  defaultValue: boolean,
) => [boolean, () => void, () => void, () => void]

declare const useNullableState: <T>(
  defaultValue: T | null,
) => [T | null, (value: T) => void, () => void]

declare const useClickOutsideElement: (
  ref: { current: HTMLElement },
  callback: () => void,
) => void

declare const useIsOffline: () => boolean
export {
  OneBlinkForm,
  OneBlinkAutoSaveForm,
  useBooleanState,
  useNullableState,
  useClickOutsideElement,
  useIsOffline,
}
