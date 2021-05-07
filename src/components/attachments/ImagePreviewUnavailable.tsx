import * as React from 'react'
import useIsOffline from '../../hooks/useIsOffline'

function ImagePreviewUnavailable() {
  const isOffline = useIsOffline()

  return (
    <>
      {isOffline ? (
        <>
          <i className="material-icons has-text-warning icon-large has-margin-bottom-6">
            wifi_off
          </i>
          <p>
            It looks like you&apos;re offline. Image preview will be available
            when connectivity is restored.
          </p>
        </>
      ) : (
        <>
          <i className="material-icons has-text-grey icon-large has-margin-bottom-6">
            attach_file
          </i>
          <p>
            You do not have access to preview this image, however, it will be
            included with your submission.
          </p>
        </>
      )}
    </>
  )
}

export default React.memo(ImagePreviewUnavailable)
