# OneBlink Apps - ReactJS | Usage

## `useIsMounted()`

This function is a react hook for determining whether the consuming component is currently mounted on the DOM.

## Return

The return type of `useIsMounted()` is an object with the following properties:

| Property  | Type      | Description                               |
| --------- | --------- | ----------------------------------------- |
| `current` | `boolean` | Whether the current component is mounted. |

`useIsMounted()` can be used like:

```js
import { useIsMounted } from '@oneblink/apps-react'

const isMounted = useIsMounted()

if (isMounted.current) {
  // DO SOMETHING HERE
}
```
