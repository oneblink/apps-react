import * as React from 'react'
import { OneBlinkAppsError } from '@oneblink/apps'

type Props = {
  error?: Error
}

function OneBlinkAppsErrorOriginalMessage({ error }: Props) {
  if (!error) {
    return null
  }

  return (
    <>
      <div className="content has-margin-top-6">
        <pre>{error.message}</pre>
      </div>
      {error instanceof OneBlinkAppsError && (
        <OneBlinkAppsErrorOriginalMessage error={error.originalError} />
      )}
    </>
  )
}

export default React.memo(OneBlinkAppsErrorOriginalMessage)
