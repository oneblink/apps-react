# OneBlink Apps-react | useClickOutsideElement Hook

## `useClickOutsideElement()`

This function is a react hook for watching for click events outside of a particular element. The hook will add and remove its own `eventListener`.

## Parameters

| Property   | Type             | Description                                                         |
| ---------- | ---------------- | ------------------------------------------------------------------- |
| `ref`      | `React.useRef()` | The ref for the element to watch for clicks outside of.             |
| `callback` | `() => void`     | The function to call when the passed element is clicked outside of. |

```js
import * as React from 'react'
import { useClickOutsideElement } from '@oneblink/apps-react'

const MyComponent = () => {
  const narrowDivRef = React.useRef(null)
  useClickOutsideElement(narrowDivRef, () => {
    console.log('Wide Div was clicked outside of narrow div...')
  })

  return (
    <div className="wide-div">
      <div ref={narrowDivRef} className="narrow-div"></div>
    </div>
  )
}

export default MyComponent
```
