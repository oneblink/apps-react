# OneBlink Apps - ReactJS | Usage

## `useFormSubmissionState()`

This function is a simple wrapper around the react hook `useState()`. The results can be passed to the [`<OneBlinkForm />`](./OneBlinkForm.md) component.

## Parameters

| Property            | Type     | Description |                                                       |
| ------------------- | -------- | ----------- | ----------------------------------------------------- |
| `form`              | `Form`   | Yes         | The OneBlink Form to render                           |
| `initialSubmission` | `Object` | No          | The initial submission data to populate the form with |

## Return

| Property               | Type       | Description                                                              |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| `result[0].definition` | `Form`     | The OneBlink Form to render                                              |
| `result[0].submission` | `Object`   | The submission data to populate the form with.                           |
| `result[1]`            | `Function` | A React state setter for handling the form definition or submission data |

## Example

```js
import {
  useFormSubmissionState,
  OneBlinkFormControlled,
} from '@oneblink/apps-react'

function Uncontrolled({ form, initialSubmission, ...props }) {
  const [{ definition, submission }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  return (
    <OneBlinkFormControlled
      {...props}
      definition={definition}
      submission={submission}
      setFormSubmission={setFormSubmission}
    />
  )
}
```
