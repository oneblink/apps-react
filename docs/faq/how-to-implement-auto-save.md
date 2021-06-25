# OneBlink Apps - ReactJS | Usage

## Implementing Controlled Auto Save

The [OneBlinkAutoSaveForm](../OneBlinkAutoSaveForm.md) component does not offer props to allow for a controlled form (i.e. having access to `submission` and `definition` values). To implement a controlled version of the `<OneBlinkAutoSaveForm />` component, use the example component below.

### Example

```tsx
import * as React from 'react'
import {
  OneBlinkAutoSaveForm,
  OneBlinkFormControlled,
  useFormSubmissionAutoSaveState,
} from '@oneblink/apps-react'

function OneBlinkAutoSaveFormControlled({
  form,
  initialSubmission,
  autoSaveKey,
  onCancel,
  onSubmit,
  onSaveDraft,
  ...props
}: React.ComponentProps<typeof OneBlinkAutoSaveForm>) {
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

  // This is just an example of how you could intercept
  // the change event when a user enters/selects a value
  // on the form.
  const customSetFormSubmission = React.useCallback(
    (formSubmission) => {
      setFormSubmission((currentFormSubmission) => {
        const newFormSubmission =
          typeof formSubmission === 'function'
            ? formSubmission(currentFormSubmission)
            : formSubmission

        // This is where you can access the updated
        // submission data or form definition.
        // You could even change the form definition
        // programmatically based on user inputs.
        console.log(
          'A change has occurred to the submission',
          newFormSubmission.submission,
        )
        newFormSubmission.definition.isInfoPage =
          !newFormSubmission.submission.doesTheUserNeedToSubmit

        return newFormSubmission
      })
    },
    [setFormSubmission],
  )

  if (isLoadingAutoSaveSubmission) {
    return <p>Checking for auto save data...</p>
  }

  if (isAutoSaveSubmissionAvailable) {
    return (
      <>
        <p>Do you want to use the auto save data?</p>
        <button onClick={startNewSubmission}>No, start again</button>
        <button onClick={continueAutoSaveSubmission}>Yes, continue</button>
      </>
    )
  }

  return (
    <OneBlinkFormControlled
      {...props}
      submission={submission}
      definition={definition}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      setFormSubmission={customSetFormSubmission}
    />
  )
}

export default React.memo(OneBlinkAutoSaveFormControlled)
```
