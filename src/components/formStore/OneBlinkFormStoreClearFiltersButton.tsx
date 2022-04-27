import * as React from 'react'
import { Button } from '@mui/material'
import { FilterList as FilterIcon } from '@mui/icons-material'
import useFormStoreTableContext from './useFormStoreTableContext'

function OneBlinkFormStoreClearFiltersButton(
  props: React.ComponentProps<typeof Button>,
) {
  const { onChangeFilters } = useFormStoreTableContext()
  return (
    <Button
      startIcon={<FilterIcon />}
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
