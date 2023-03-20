# OneBlink Apps - ReactJS | Usage

## `<OneBlinkForm />`

Component for rendering a OneBlink Form. This component will render the submit, cancel and save draft buttons but it is up to the developer to implement what happens when those buttons are clicked.

It is also recommended to import the `css` from this library as well.

```js
import { OneBlinkForm } from '@oneblink/apps-react'
import '@oneblink/apps-react/dist/styles.css'
```

### Props

| Property                             | Type                                            | Required    | Description                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form`                               | `Form`                                          | Yes         | The OneBlink Form to render                                                                                                                                                                                                                                                             |
| `initialSubmission`                  | `Object`                                        | No          | The initial submission data                                                                                                                                                                                                                                                             |
| `resumeAtElement`                    | `FormElement`                                   | No          | The element to resume the form at.                                                                                                                                                                                                                                                      |
| `googleMapsApiKey`                   | `string`                                        | Conditional | A [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key). Required if the form contains a `location` form element.                                                                                                                              |
| `abnLookupAuthenticationGuid`        | `string`                                        | Conditional | An [ABN Lookup Authentication Guid](https://abr.business.gov.au/Tools/WebServices). Required if the form contains a `abn` form element.                                                                                                                                                 |
| `captchaSiteKey`                     | `string`                                        | Conditional | A [reCAPTCHA Site Key](https://developers.google.com/recaptcha/intro). Required if the form contains a `captcha` form element.                                                                                                                                                          |
| `onSubmit`                           | `(FormSubmissionResult) => void`                | Yes         | The function to call when the user submits the form with valid submission data. See [NewFormSubmission](https://oneblink.github.io/apps/modules/submissionService.html#NewFormSubmission) for the structure of the argument.                                                            |
| `onCancel`                           | `() => void`                                    | Yes         | The function to call when the user cancels the form                                                                                                                                                                                                                                     |
| `onSaveDraft`                        | `(FormSubmission) => void`                      | No          | The function to call when the user wishes to save there submission data as a draft submission. If not specified, drafts cannot be saved. See [NewDraftSubmission](https://oneblink.github.io/apps/modules/submissionService.html#NewDraftSubmission) for the structure of the argument. |
| `disabled`                           | `boolean`                                       | No          | Whether the form is currently able to be submitted. False by default.                                                                                                                                                                                                                   |
| `buttons`                            | [`ButtonsConfiguration`](#buttonsconfiguration) | No          | Change properties for certain buttons on the form.                                                                                                                                                                                                                                      |
| `primaryColour`                      | `string`                                        | No          | Hex colour value for certain inputs (defaults to `#4c8da7`) .                                                                                                                                                                                                                           |
| `attachmentRetentionInDays`          | `number`                                        | No          | Number of days attachments are retained for.                                                                                                                                                                                                                                            |
| `allowSubmitWithPendingAttachments ` | `boolean`                                       | No          | Prompt the user to allow them to continue with attachments uploading if true. False by default.                                                                                                                                                                                         |
| `isInfoPage `                        | `"YES" \| "NO" \| "CALCULATED"`                 | No          | Determines whether the form is submittable or not. Info page type forms show a "Done" button instead of a "Submit" button. Defaults to "CALCULATED"                                                                                                                                     |

### ButtonsConfiguration

| Property          | Type                                          | Required | Description                                                |
| ----------------- | --------------------------------------------- | -------- | ---------------------------------------------------------- |
| `submit`          | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Submit button                    |
| `cancel`          | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Cancel button                    |
| `saveDraft`       | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Save Draft button                |
| `cancelPromptYes` | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Unsaved Changes - Discard button |
| `cancelPromptNo`  | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Unsaved Changes - Back button    |

### ButtonConfiguration

| Property | Type     | Required | Description                                                                                                                                                                   |
| -------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`  | `string` | No       | Change the text that appears in the button                                                                                                                                    |
| `icon`   | `string` | No       | Add a [Material Icon](https://fonts.google.com/icons?selected=Material+Icons:home) to the button, the string must be the part that goes `<i class="material-icons">HERE</i>`) |

### FormSubmission

| Property     | Type           | Description                                                                                                                       |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `submission` | `Object`       | The submission data                                                                                                               |
| `definition` | `OneBlinkForm` | The OneBlink Form, this will be different from the `form` prop passed to the Component as it is cloned when the component mounts. |

### FormSubmissionResult

Inherits properties from [`FormSubmission`](#formsubmission)

| Property        | Type       | Description                                         |
| --------------- | ---------- | --------------------------------------------------- |
| `captchaTokens` | `string[]` | Captcha tokens gathered by a `captcha` Form Element |

### Example

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { FormTypes } from '@oneblink/types'
import {
  OneBlinkAppsError,
  draftService,
  submissionService,
} from '@oneblink/apps'
import {
  IsOfflineContextProvider,
  OneBlinkForm,
  useIsMounted,
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

function FormContainer() {
  const isMounted = useIsMounted()

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
  }, [isMounted])

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
    <OneBlinkForm
      captchaSiteKey={captchaSiteKey}
      googleMapsApiKey={googleMapsApiKey}
      formsAppId={formsAppId}
      form={form}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      attachmentRetentionInDays={1}
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
