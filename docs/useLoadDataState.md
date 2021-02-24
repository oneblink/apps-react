# OneBlink Apps - ReactJS | Usage

## `useLoadDataState()`

This function is a react hook for managing the state involved with loading data.

## Parameters

The hook takes a single function as an argument:

| Property | Type       | Description                                                                     |
| -------- | ---------- | ------------------------------------------------------------------------------- |
| `onLoad` | `function` | The function that fetches your data. Should be a Promise that returns your data |

## Return

The return type of `useLoadDataState()` is an object with the following properties:

| Property     | Type            | Description                                                                         |
| ------------ | --------------- | ----------------------------------------------------------------------------------- |
| `state`      | `LoadDataState` | The current state.                                                                  |
| `handleLoad` | `function`      | A function that runs the `onLoad` function again. This can be used to refresh data. |

`useLoadDataState()` can be used like:

```js
import { useLoadDataState } from '@oneblink/apps-react'
import fetchData from 'fetchData' // Must be a function which returns a promise of some data

const [state, refresh] = useLoadDataState(fetchData)

switch (state.status) {
  case 'LOADING':
    return <Loading />
  case 'ERROR':
    return <Error message={state.error} />
  case 'SUCCESS':
  // RENDER UI
}
```

## LoadDataState

The object returned as the state of the hook. Can be any of:

SUCCESS:

| Property | Type     | Description       |
| -------- | -------- | ----------------- |
| `status` | `string` | Set to 'SUCCESS'. |
| `result` | `object` | Your data.        |

ERROR:

| Property | Type     | Description                  |
| -------- | -------- | ---------------------------- |
| `status` | `string` | Set to 'ERROR'.              |
| `error`  | `Error`  | A javascript `Error` object. |

LOADING:

| Property | Type     | Description       |
| -------- | -------- | ----------------- |
| `status` | `string` | Set to 'LOADING'. |
