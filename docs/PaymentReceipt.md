# OneBlink Apps - ReactJS | Usage

## `<PaymentReceipt />`

Component for rendering a OneBlink Form Payment Receipt. This component will payment receipt but it is up to the developer to implement what happens when the user clicks 'Done'.

It is also recommended to import the `css` from this library as well.

```js
import { PaymentReceipt } from '@oneblink/apps-react'
import '@oneblink/apps-react/dist/styles.css'
```

### Props

| Property | Type     | Required | Description                                      |
| -------- | -------- | -------- | ------------------------------------------------ |
| onDone   | function | Yes      | The function to call when the user clicks 'Done' |

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { PaymentReceipt } from '@oneblink/apps-react'
import '@oneblink/apps-react/dist/styles.css'

function ReceiptContainer() {
  const handleDone = React.useCallback(async () => {
    console.log('All done!')
  }, [])

  return <PaymentReceipt onDone={handleDone} />
}

function App() {
  return (
    <IsOfflineContextProvider>
      <ReceiptContainer />
    </IsOfflineContextProvider>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```
