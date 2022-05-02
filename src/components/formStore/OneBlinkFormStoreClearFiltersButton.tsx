import * as React from 'react'
import { Button } from '@mui/material'
import { FilterList as FilterIcon } from '@mui/icons-material'
import useFormStoreTableContext from './useFormStoreTableContext'

function OneBlinkFormStoreClearFiltersButton(
  props: React.ComponentProps<typeof Button>,
) {
  const { onChangeFilters, filters } = useFormStoreTableContext()
  const isDisabled = React.useMemo(() => {
    return !Object.keys(filters).some((key) => key !== 'sorting')
  }, [filters])
  return (
    <Button
      className="ob-form-store-clear-filters-button"
      startIcon={<FilterIcon />}
      disabled={isDisabled}
      onClick={() => {
        onChangeFilters(
          (currentFilters) => ({
            sorting: currentFilters.sorting,
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
