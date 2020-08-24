# OneBlink Apps - ReactJS | Usage

## `useClickOutsideElement()`

This function is a react hook for watching for click events outside of a particular element. The hook will add and remove its own `eventListener`.

## Parameters

| Property   | Type             | Description                                                         |
| ---------- | ---------------- | ------------------------------------------------------------------- |
| `ref`      | `React.useRef()` | The ref for the element to watch for clicks outside of.             |
| `callback` | `() => void`     | The function to call when the passed element is clicked outside of. |

- For performance reasons, it is important to pass a memoised function as the callback argument, eg:

```js
React.useCallback(() => {}, [])
```

```js
import * as React from 'react'
import { useClickOutsideElement } from '@oneblink/apps-react'

const MyComponent = () => {
  const narrowDivRef = React.useRef(null)
  useClickOutsideElement(
    narrowDivRef,
    React.useCallback(() => {
      console.log('Wide Div was clicked outside of narrow div...')
    }, []),
  )

  return (
    <div className="wide-div">
      <div ref={narrowDivRef} className="narrow-div"></div>
    </div>
  )
}

export default MyComponent
```
