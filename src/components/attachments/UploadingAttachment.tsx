import * as React from 'react'
import { Tooltip } from '@material-ui/core'
import useIsOffline from '../../hooks/useIsOffline'
import OnLoading from '../OnLoading'

function UploadingAttachment() {
  const isOffline = useIsOffline()

  return (
    <Tooltip
      title={
        isOffline
          ? 'Upload will start when you connect to the internet'
          : 'Uploading'
      }
    >
      <div className="ob-figure__status cypress-attachment-uploading">
        {isOffline ? (
          <i className="material-icons has-text-warning">wifi_off</i>
        ) : (
          <OnLoading tiny />
        )}
      </div>
    </Tooltip>
  )
}

export default React.memo(UploadingAttachment)
