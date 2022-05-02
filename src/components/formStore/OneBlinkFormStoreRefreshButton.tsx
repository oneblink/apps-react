import * as React from 'react'
import { Button } from '@mui/material'
import { Sync as SyncIcon } from '@mui/icons-material'
import useFormStoreTableContext from './useFormStoreTableContext'

function OneBlinkFormStoreRefreshButton(
  props: React.ComponentProps<typeof Button>,
) {
  const { onRefresh, submissionIdValidationMessage } =
    useFormStoreTableContext()
  return (
    <Button
      className="ob-form-store-refresh-button"
      startIcon={<SyncIcon />}
      onClick={onRefresh}
      color="primary"
      variant="contained"
      disabled={!!submissionIdValidationMessage}
      // eslint-disable-next-line react/no-children-prop
      children={<>Refresh</>}
      {...props}
    />
  )
}

export default React.memo(OneBlinkFormStoreRefreshButton)
