# OneBlink Apps - ReactJS | Usage

## `<AuthContextProvider />`

`<AuthContextProvider />` is a React Component that provides the context for the `useAuth()` hook to be used by components further down your component tree. **It should only be included in your component tree once and ideally at the root of the application.**

### Props

| Property        | Type         | Required | Description                                                                                |
| --------------- | ------------ | -------- | ------------------------------------------------------------------------------------------ |
| `formsKeyToken` | `string`     | No       | A Forms Key token being used to make requests to the OneBlink API on behalf of the user    |
| `userToken`     | `string`     | No       | An encrypted user token that will be used included in the submission on behalf of the user |
| `children`      | `React.Node` | Yes      | Your application components                                                                |

### Usage

```jsx
import * as React from 'react'
import { AuthContextProvider } from '@oneblink/apps-react'

function Component() {
  const auth = useAuth()
  // use auth here
}

function App() {
  return (
    <AuthContextProvider>
      <Component />
    </AuthContextProvider>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```

## `useAuth()`

A React hook for containing state associated the current user. **This hook requires `<AuthContextProvider />` to be present in your component tree.**

https://github.com/oneblink/apps/blob/master/docs/auth-service.md#profile

### Return

The return type is an object with the following properties:

| Property           | Type                                                                                               | Description                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `isLoggedIn`       | `boolean`                                                                                          | `true` if the current user is logged in page.                                                                                   |
| `userProfile`      | [Profile](https://github.com/oneblink/apps/blob/master/docs/auth-service.md#profile) &#124; `null` | See [auth-service.getUserProfile()](https://github.com/oneblink/apps/blob/master/docs/auth-service.md#getuserprofile)           |
| `userFriendlyName` | `string` &#124; `null`                                                                             | See [auth-service.getUserFriendlyName()](https://github.com/oneblink/apps/blob/master/docs/auth-service.md#getuserfriendlyname) |
| `isUsingFormsKey`  | `boolean`                                                                                          | `true` if `<AuthContextProvider />` was passed the `formsKeyToken` prop                                                         |

### Example

```js
import { useAuth } from '@oneblink/apps-react'

function Component() {
  const {
    isLoggedIn,
    userProfile,
    userFriendlyName,
    isUsingFormsKey,
  } = useAuth()
}
```
