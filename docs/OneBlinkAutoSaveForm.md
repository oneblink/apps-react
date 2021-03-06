# OneBlink Apps - ReactJS | Usage

## `<OneBlinkAutoSaveForm />`

This component is a drop in replacement for [`<OneBlinkForm />`](./OneBlinkForm.md) with the addition of auto save happening periodically to prevent users from losing submission data.

If you need auto saving with a controlled form, [read this](./faq/how-to-implement-auto-save.md).

```js
import { OneBlinkAutoSaveForm } from '@oneblink/apps-react'
```

### Props

Inherits properties from [`<OneBlinkForm />`](./OneBlinkForm.md#props)

| Property      | Type     | Required | Description                                                                          |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------------ |
| `autoSaveKey` | `string` | No       | Optionally pass a unique key for this submission e.g. the `externalId` the parameter |
