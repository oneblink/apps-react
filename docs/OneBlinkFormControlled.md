# OneBlink Apps - ReactJS | Usage

## `<OneBlinkFormControlled />`

Similar to [`<OneBlinkForm />`](./OneBlinkForm.md), however requires props to control the `definition`, `submission` values.

### Props

| Property            | Type                                                                      | Required | Description                                                                       |
| ------------------- | ------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `definition`        | `Form`                                                                    | Yes      | The OneBlink Form to render                                                       |
| `submission`        | `Object`                                                                  | Yes      | The submission data                                                               |
| `setFormSubmission` | React State Setter [`<FormSubmission>`](./OneBlinkForm.md#formsubmission) | Yes      | A React state setter for handling the form definition or submission data changing |

Also requires the same props as [`<OneBlinkForm />`](./OneBlinkForm.md) with the exception of:

- `form`
- `initialSubmission`

### Example

```js
import React from 'react'
import ReactDOM from 'react-dom'
import {
  OneBlinkAppsError,
  draftService,
  submissionService,
  FormTypes,
} from '@oneblink/apps'
import {
  IsOfflineContextProvider,
  OneBlinkForm,
  useIsMounted,
  useFormSubmissionState,
} from '@oneblink/apps-react'
import '@oneblink/apps-react/dist/styles.css'

const captchaSiteKey = 'ENTER_YOUR_SITE_KEY_HERE'
const googleMapsApiKey = 'ENTER_YOUR_MAPS_API_KEY_HERE'
const formsAppId = 1
const form: FormTypes.Form = {
  id: 1,
  name: 'Name of Form',
  description: '',
  organisationId: 'abc123',
  formsAppEnvironmentId: 1,
  formsAppIds: [],
  elements: [],
  isAuthenticated: false,
  isMultiPage: false,
  isInfoPage: false,
  publishStartDate: null,
  publishEndDate: null,
  postSubmissionAction: 'FORMS_LIBRARY',
  submissionEvents: [],
  tags: [],
}
const initialSubmission: Record<string, unknown> = {
  data: 1,
}

function FormContainer() {
  const isMounted = useIsMounted()

  const [{ definition, submission }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const [{ isSavingDraft, saveDraftError }, setSaveDraftState] = React.useState(
    {
      isSavingDraft: false,
      saveDraftError: null,
    },
  )

  const [{ isSubmitting, submitError, formSubmissionResult }, setSubmitState] =
    React.useState({
      formSubmissionResult: null,
      isSubmitting: false,
      submitError: null,
    })

  const handleSubmit = React.useCallback(
    async (newFormSubmission: FormTypes.NewFormSubmission) => {
      const formSubmission: FormSubmission = Object.assign(
        {},
        newFormSubmission,
        {
          formsAppId,
          jobId: null,
          externalId: null,
          draftId: null,
          preFillFormDataId: null,
        },
      )

      setSubmitState({
        formSubmissionResult: null,
        submitError: null,
        isSubmitting: true,
      })

      try {
        const newFormSubmissionResult = await submissionService.submit({
          formSubmission,
        })
        if (
          newFormSubmissionResult.isOffline &&
          !newFormSubmissionResult.isInPendingQueue
        ) {
          throw new OneBlinkAppsError(
            'You cannot submit this form while offline, please try again when connectivity is restored.',
            {
              isOffline: true,
            },
          )
        }

        if (isMounted.current) {
          setSubmitState({
            formSubmissionResult: newFormSubmissionResult,
            isSubmitting: false,
            submitError: null,
          })
        }
      } catch (error) {
        if (isMounted.current) {
          setSubmitState({
            formSubmissionResult: null,
            isSubmitting: false,
            submitError: error,
          })
        }
      }
    },
    [isMounted],
  )

  const handleSaveDraft = React.useCallback(
    async (newDraftSubmission: FormTypes.NewDraftSubmission) => {
      const draftSubmission: FormTypes.DraftSubmission = {
        ...newDraftSubmission,
        formsAppId,
      }
      setSaveDraftState({
        saveDraftError: null,
        isSavingDraft: true,
      })

      try {
        await draftService.addDraft(
          {
            title: form.name,
            formId: form.id,
            externalId: null,
            jobId: null,
          },
          draftSubmission,
        )

        if (isMounted.current) {
          setSaveDraftState({
            saveDraftError: null,
            isSavingDraft: false,
          })
        }
      } catch (error) {
        if (isMounted.current) {
          setSaveDraftState({
            saveDraftError: error,
            isSavingDraft: false,
          })
        }
      }
    },
    [isMounted],
  )

  const handleCancel = React.useCallback(() => {
    // handle cancel here...
  }, [])

  if (isSubmitting) {
    // Render submitting animation/loading
  }

  if (submitError) {
    // Render error while submitting
  }

  if (isSavingDraft) {
    // Render saving draft animation/loading
  }

  if (saveDraftError) {
    // Render error while saving draft
  }

  if (formSubmissionResult) {
    // Render submission success
  }

  return (
    <OneBlinkFormControlled
      captchaSiteKey={captchaSiteKey}
      googleMapsApiKey={googleMapsApiKey}
      formsAppId={formsAppId}
      definition={definition}
      submission={submission}
      setFormSubmission={setFormSubmission}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
    />
  )
}

function App() {
  return (
    <IsOfflineContextProvider>
      <FormContainer />
    </IsOfflineContextProvider>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```
