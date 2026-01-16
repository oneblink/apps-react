import * as React from 'react'
import { Button } from '@mui/material'
import useFormStoreTableContext from './useFormStoreTableContext'
import MaterialIcon from '../MaterialIcon'
import { formStoreService } from '../../apps'

function OneBlinkFormStoreClearFiltersButton(
  props: React.ComponentProps<typeof Button>,
) {
  const { onChangeParameters, parameters } = useFormStoreTableContext()
  const isDisabled = React.useMemo(() => {
    return !parameters.filters || !Object.keys(parameters.filters).length
  }, [parameters.filters])
  return (
    <Button
      className="ob-form-store-clear-filters-button"
      startIcon={<MaterialIcon>filter_list</MaterialIcon>}
      disabled={isDisabled}
      onClick={() => {
        onChangeParameters(
          (currentParameters: formStoreService.FormStoreParameters) => ({
            ...currentParameters,
            filters: undefined,
          }),
          false,
        )
      }}
       
      children={<>Clear Filters</>}
      {...props}
    />
  )
}

/**
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkFormStoreClearFiltersButton)
