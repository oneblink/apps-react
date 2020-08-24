# OneBlink Apps-react | useIsOffline Hook

## `<IsOfflineContextProvider />`

IsOfflineContextProvider is a React Component that provides the `isOffline` state for components further down your component tree to consume.
It should be used to wrap the components requiring the state.

- **This component is required in your component tree to be able to consume the `useIsOffline` hook.**

### Usage

```jsx
import { IsOfflineContextProvider } from '@oneblink/apps-react'

const TopLevelComponent = () => {
  return (
    <IsOfflineContextProvider>
      <div>
        <ComponentThatRequiresOfflineState />
      </div>
    </IsOfflineContextProvider>
  )
}

export default TopLevelComponent
```

## `useIsOffline()`

This function is a react hook for determining whether an application is in an offline state.

- **This component requires `IsOfflineContextProvider` to be present in your component tree.**

### Return

The return type of `useIsOffline()` is a `boolean`

The hook can be used like:

```js
import { useIsOffline } from '@oneblink/apps-react'

const isOffline = useIsOffline()
```
