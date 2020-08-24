# OneBlink Apps - ReactJS | Usage

## `useBooleanState()`

This function is a react hook for boolean state that comes with `useCallback`s for 'turning on', 'turning off' and toggling the state.

## Parameters

| Property       | Type      | Description                      |
| -------------- | --------- | -------------------------------- |
| `defaultValue` | `boolean` | The starting state for the hook. |

## Return

The return type of `useBooleanState(true)` is an array where:

- The first item is a `boolean` (the state).
- The second item is `() => void` (a function that sets the state to true).
- The third item is `() => void` (a function that sets the state to false).
- The fourth item is `() => void` (a function that toggles the state to the opposite of what it currently is).

As such, the items in the array can be destructured and named whatever you like:

```js
import { useBooleanState } from '@oneblink/apps-react'

const [
  dialogIsOpen /* true */,
  openDialog,
  closeDialog,
  toggleDialog,
] = useBooleanState(true)
```

These properties can then be used like:

```js
openDialog()
closeDialog()
toggleDialog()
```
