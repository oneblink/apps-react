import * as React from 'react'
import { Button } from '@mui/material'
import useFormStoreTableContext from './useFormStoreTableContext'
import MaterialIcon from '../MaterialIcon'

function OneBlinkFormStoreRefreshButton(
  props: React.ComponentProps<typeof Button>,
) {
  const { onRefresh, submissionIdValidationMessage } =
    useFormStoreTableContext()
  return (
    <Button
      className="ob-form-store-refresh-button"
      startIcon={<MaterialIcon>sync</MaterialIcon>}
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

/**
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkFormStoreRefreshButton)
