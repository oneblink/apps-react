import * as React from 'react'
import OnLoading from './components/renderer/OnLoading'
import Modal from './components/renderer/Modal'
import OneBlinkFormBase from './OneBlinkFormBase'
import useFormSubmissionAutoSaveState from './hooks/useFormSubmissionAutoSaveState'
import { OneBlinkFormUncontrolled } from './OneBlinkForm'

type Props = React.ComponentProps<typeof OneBlinkFormUncontrolled> & {
  autoSaveKey: string
}

function OneBlinkAutoSaveForm({
  form,
  initialSubmission,
  autoSaveKey,
  onCancel,
  onSubmit,
  onSaveDraft,
  ...props
}: Props) {
  const {
    definition,
    submission,
    isLoadingAutoSaveSubmission,
    isAutoSaveSubmissionAvailable,
    startNewSubmission,
    continueAutoSaveSubmission,
    handleSubmit,
    handleCancel,
    handleSaveDraft,
    setFormSubmission,
  } = useFormSubmissionAutoSaveState({
    form,
    initialSubmission,
    autoSaveKey,
    onCancel,
    onSubmit,
    onSaveDraft,
  })

  if (isLoadingAutoSaveSubmission) {
    return (
      <div className="cypress-loading has-text-centered">
        <OnLoading className="has-text-centered"></OnLoading>
      </div>
    )
  }

  if (isAutoSaveSubmissionAvailable) {
    return (
      <Modal
        isOpen
        title="Continue?"
        cardClassName="cypress-continue-auto-save"
        actions={
          <>
            <button
              type="button"
              className="button ob-button is-light cypress-continue-auto-save-start-again-button"
              onClick={startNewSubmission}
            >
              Start Again
            </button>
            <button
              type="button"
              className="button ob-button is-primary cypress-continue-auto-save-continue-button"
              onClick={continueAutoSaveSubmission}
            >
              Continue
            </button>
          </>
        }
      >
        We found an in progress submission, would you like to pick up where you
        left off or start again?
      </Modal>
    )
  }

  return (
    <OneBlinkFormBase
      {...props}
      isReadOnly={false}
      submission={submission}
      definition={definition}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      setFormSubmission={setFormSubmission}
    />
  )
}

export default React.memo(OneBlinkAutoSaveForm)
