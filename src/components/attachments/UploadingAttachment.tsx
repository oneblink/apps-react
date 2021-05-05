import * as React from 'react'
import { Tooltip } from '@material-ui/core'
import useIsOffline from '../../hooks/useIsOffline'
import OnLoading from '../OnLoading'

interface Props {
  children?: React.ReactNode
}
function UploadingAttachment({ children }: Props) {
  const isOffline = useIsOffline()
  const loader: React.ReactNode = React.useMemo(() => {
    if (children) return children
    return <OnLoading tiny />
  }, [children])

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
          loader
        )}
      </div>
    </Tooltip>
  )
}

export default React.memo<Props>(UploadingAttachment)
