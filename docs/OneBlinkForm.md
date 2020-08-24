# OneBlink Apps - ReactJS | Usage

## `<OneBlinkForm />`

Component for rendering a OneBlink Form. This component will render the submit, cancel and save draft buttons but it is up to the developer to implement what happens when those buttons are clicked.

It is also recommended to import the `(s)css` for from this library as well.

```js
import { OneBlinkForm } from '@oneblink/apps-react'
import '@oneblink/apps-react/dist/styles.css'
```

### Props

| Property            | Type                           | Required    | Description                                                                                                                                                                                                               |
| ------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form`              | `OneBlinkForm`                 | Yes         | The OneBlink Form to render                                                                                                                                                                                               |
| `initialSubmission` | `Object`                       | No          | The initial submission data                                                                                                                                                                                               |
| `googleMapsApiKey`  | `string`                       | Conditional | A [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key). Required if the form contains a `location` form element.                                                                |
| `captchaSiteKey`    | `string`                       | Conditional | A [reCAPTCHA Site Key](https://developers.google.com/recaptcha/intro). Required if the form contains a `captcha` form element.                                                                                            |
| `onSubmit`          | `(NewFormSubmission) => void`  | Yes         | The function to call when the user submits the form with valid submission data. See [NewFormSubmission](#newformsubmission) for the structure of the argument.                                                            |
| `onCancel`          | `() => void`                   | Yes         | The function to call when the user cancels the form                                                                                                                                                                       |
| `onSaveDraft`       | `(NewDraftSubmission) => void` | No          | The function to call when the user wishes to save there submission data as a draft submission. If not specified, drafts cannot be saved. See [NewDraftSubmission](#newdraftsubmission) for the structure of the argument. |

### NewDraftSubmission

| Property     | Type           | Description                                                                                                                       |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `submission` | `Object`       | The submission data                                                                                                               |
| `definition` | `OneBlinkForm` | The OneBlink Form, this will be different from the `form` prop passed to the Component as it is cloned when the component mounts. |

### NewFormSubmission

Inherits properties from [`NewDraftSubmission`](#newdraftsubmission)

| Property        | Type       | Description                                         |
| --------------- | ---------- | --------------------------------------------------- |
| `captchaTokens` | `string[]` | Captcha tokens gathered by a `captcha` Form Element |

### Example

```js
// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, useHistory } from 'react-router-dom'
import {
  OneBlinkAppsError,
  draftService,
  submissionService,
} from '@oneblink/apps'
import '@oneblink/apps-react/dist/styles.css'
import {
  IsOfflineContextProvider,
  OneBlinkForm,
  useIsMounted,
} from '@oneblink/apps-react'

const formsAppId = 1
const form: Form = {
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

function FormContainer() {
  const isMounted = useIsMounted()
  const history = useHistory()
  const [
    postSubmissionActionErrorMessage,
    setPostSubmissionActionErrorMessage,
  ] = React.useState<string>('')
  const [{ isSavingDraft, saveDraftError }, setSaveDraftState] = React.useState(
    {
      isSavingDraft: false,
      saveDraftError: null,
    },
  )

  const [
    { isSubmitting, submitError, formSubmissionResult },
    setSubmitState,
  ] = React.useState({
    formSubmissionResult: null,
    isSubmitting: false,
    submitError: null,
  })

  const handlePostSubmissionAction = React.useCallback(
    async (formSubmissionResult: FormSubmissionResult) => {
      try {
        await submissionService.executePostSubmissionAction(
          formSubmissionResult,
          history.push,
        )
      } catch (error) {
        if (isMounted.current) {
          setPostSubmissionActionErrorMessage(error.message)
        }
      }
    },
    [history.push, isMounted],
  )

  const handleSubmit = React.useCallback(
    async (formSubmission: FormSubmission) => {
      const formSubmissionResult: FormSubmissionResult = Object.assign(
        {},
        formSubmission,
        {
          jobId: null,
          externalId: null,
          draftId: null,
          preFillFormDataId: null,
          isInPendingQueue: false,
          isOffline: false,
          payment: null,
          submissionId: null,
          submissionTimestamp: null,
        },
      )

      setSubmitState({
        formSubmissionResult: null,
        submitError: null,
        isSubmitting: true,
      })

      try {
        const newFormSubmissionResult = await submissionService.submit({
          formSubmission: formSubmissionResult,
          paymentReceiptUrl: `${window.location.origin}/forms/${form.id}/payment-receipt`,
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
    async (newDraftSubmission: NewDraftSubmission) => {
      const draftFormSubmissionResult: DraftSubmission = {
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
          draftFormSubmissionResult,
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

  if (postSubmissionActionErrorMessage) {
    // Render error executing post submission action
  }

  return (
    <OneBlinkForm
      captchaSiteKey={__RECAPTCHA_SITE_KEY__}
      googleMapsApiKey={__GOOGLE_MAPS_API_KEY__}
      formsAppId={formsAppId}
      initialSubmission={{}}
      form={form}
      onCancel={submissionService.cancelForm}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
    />
  )
}

function App() {
  return (
    <IsOfflineContextProvider>
      <BrowserRouter>
        <Route path="/" exact>
          <FormContainer />
        </Route>
      </BrowserRouter>
    </IsOfflineContextProvider>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```
