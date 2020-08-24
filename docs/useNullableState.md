# OneBlink Apps-react | useNullableState Hook

## `useNullableState()`

This function is a react hook for state of type of your choosing. It comes with two memoized functions, one for setting state and one for clearing it.

- Note: `T` represents the type of the state you pass as a default value.

## Paramaters

| Property       | Type | Description                      |
| -------------- | ---- | -------------------------------- |
| `defaultValue` | `T`  | The starting state for the hook. |

## Return

The return type of `useNullableState(myState)` is an array where:

- The first item is of type `T` (the state).
- The second item is `(newValue: T) => void` (a function that sets the state to the `newValue`).
- The third item is `() => void` (a function that (un)sets the state to `null` ).

As such, the items in the array can be destructured and named whatever you like:

```js
import { useNullableState } from '@oneblink/apps-react'

const startingProfile = {
  name: 'Forest Gump',
  profession: 'Military, Athlete, Other',
}

const [
  userProfile /* {
  name: 'Forest Gump',
  profession: 'Military, Athlete, Other',
} */,
  setUserProfile /* A function that takes an object typed as {
    name: string,
    profession: string
  } */,
  unsetUserProfile,
] = useBooleanState(startingProfile)
```

`setUserProfile` can then be called with an object of type `T` like:

```js
setUserProfile({
  name: 'Walter White',
  profession: 'Chemistry Teacher (Secondary School), Other',
})
```

and `unsetUserProfile` can be called like:

```js
unsetUserProfile()
```
