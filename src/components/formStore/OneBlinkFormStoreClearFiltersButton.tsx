import * as React from 'react'
import { Button } from '@mui/material'
import { FilterList as FilterIcon } from '@mui/icons-material'
import useFormStoreTableContext from './useFormStoreTableContext'

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
      startIcon={<FilterIcon />}
      disabled={isDisabled}
      onClick={() => {
        onChangeParameters(
          (currentParameters) => ({
            ...currentParameters,
            filters: undefined,
          }),
          false,
        )
      }}
      // eslint-disable-next-line react/no-children-prop
      children={<>Clear Filters</>}
      {...props}
    />
  )
}

export default React.memo(OneBlinkFormStoreClearFiltersButton)
