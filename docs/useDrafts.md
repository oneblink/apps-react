# OneBlink Apps - ReactJS | Usage

## `<DraftsContextProvider />`

`<DraftsContextProvider />` is a React Component that provides the context for the `useDrafts()` hook to be used by components further down your component tree. **It should only be included in your component tree once and ideally at the root of the application.**

### Props

| Property          | Type         | Required | Description                                                                               |
| ----------------- | ------------ | -------- | ----------------------------------------------------------------------------------------- |
| `formsAppId`      | `number`     | Yes      | The identifier for the forms app associated with the user's drafts                        |
| `isDraftsEnabled` | `boolean`    | Yes      | `true` if drafts are enabled, otherwise `false`. Can be used for account tier validation. |
| `children`        | `React.Node` | Yes      | Your application components                                                               |

### Usage

```jsx
import * as React from 'react'
import { AuthContextProvider } from '@oneblink/apps-react'

function Component() {
  const { drafts } = useDrafts()
  // use drafts here
}

function App() {
  return (
    <DraftsContextProvider>
      <Component />
    </DraftsContextProvider>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```

## `useDrafts()`

A React hook for containing state associated to the current user's drafts. **This hook requires `<DraftsContextProvider />` to be present in your component tree.**

### Return

See typescript types for details:

| Property       | Type      | Description                                                             |
| -------------- | --------- | ----------------------------------------------------------------------- |
| `isLoading`    | `boolean` | `true` drafts are currently loading.                                    |
| `loadError`    | `Error`   | Set if loading the drafts failed                                        |
| `drafts`       | `Draft[]` | The array of drafts                                                     |
| `reloadDrafts` | `boolean` | `true` if `<AuthContextProvider />` was passed the `formsKeyToken` prop |

### Example

```js
import { useDrafts } from '@oneblink/apps-react'

function Component() {
  const {
    isLoading,
    loadError,
    drafts,
    reloadDrafts,
    clearLoadError,
    isSyncing,
    syncDrafts,
    syncError,
    clearSyncError,
    deleteDraft,
  } = useDrafts()
}
```
