import * as React from 'react'
import OnLoading from './components/renderer/OnLoading'
import Modal from './components/renderer/Modal'
import OneBlinkFormBase from './OneBlinkFormBase'
import useFormSubmissionAutoSaveState from './hooks/useFormSubmissionAutoSaveState'
import { OneBlinkFormUncontrolled } from './OneBlinkForm'

function OneBlinkAutoSaveForm({
  form,
  initialSubmission,
  resumeAtElement,
  autoSaveKey,
  removeAutoSaveDataBeforeSubmit,
  removeAutoSaveDataBeforeSaveDraft,
  onCancel,
  onSubmit,
  onSaveDraft,
  ...props
}: React.ComponentProps<typeof OneBlinkFormUncontrolled> & {
  /** Pass a unique key for this submission e.g. the `externalId` the parameter */
  autoSaveKey: string
  /**
   * By default, auto save data is removed when the user clicks Submit. If you
   * would like auto save data to persist and clean up the auto save data later,
   * pass `false`.
   */
  removeAutoSaveDataBeforeSubmit?: boolean
  /**
   * By default, auto save data is removed when the user clicks Save Draft. If
   * you would like auto save data to persist and clean up the auto save data
   * later, pass `false`.
   */
  removeAutoSaveDataBeforeSaveDraft?: boolean
}) {
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
    handleNavigateAway,
    lastElementUpdated,
    executedLookups,
  } = useFormSubmissionAutoSaveState({
    form,
    initialSubmission,
    resumeAtElement,
    autoSaveKey,
    removeAutoSaveDataBeforeSubmit,
    removeAutoSaveDataBeforeSaveDraft,
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
              autoFocus
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
      handleNavigateAway={handleNavigateAway}
      lastElementUpdated={lastElementUpdated}
      executedLookups={executedLookups}
    />
  )
}

/**
 * This component is a drop in replacement for {@link OneBlinkForm} with the
 * addition of auto save happening periodically to prevent users from losing
 * submission data.
 *
 * If you need auto saving with a controlled form, see the
 * {@link OneBlinkFormControlled} component for a full example.
 *
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkAutoSaveForm)
