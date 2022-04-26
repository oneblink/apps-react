import * as React from 'react'
import { Typography, Divider } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../../../hooks/useBooleanState'
import generateColumns from './generateColumns'
import { useTable } from 'react-table'
import RepeatableSetCellAccordion from './RepeatableSetCellAccordion'

export const useRepeatableSetCellStyles = makeStyles((theme) => {
  return {
    entriesWrapper: { width: '100%' },
    cellRowWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: theme.spacing(),
      width: '100%',
    },
    cellValueWrapper: {
      flex: 2,
      marginLeft: theme.spacing(),
      textAlign: 'right',
      width: '100%',
    },
    divider: { margin: theme.spacing(1, -2) },
  }
})

type Props = {
  value: Array<Record<string, unknown>>
  formElement: FormTypes.RepeatableSetElement
}

const RepeatableSetCell = ({ formElement, value }: Props) => {
  const classes = useRepeatableSetCellStyles()
  const [isVisible, , , toggleVisibility] = useBooleanState(false)
  const hasMultipleEntries = value.length > 1
  const columns = React.useMemo(
    () =>
      generateColumns({
        onChangeFilters: () => {},
        formElements: formElement.elements,
        parentElementNames: [],
        initialColumns: [],
        allowCopy: false,
        filters: {},
      }),
    [formElement.elements],
  )
  const { rows, prepareRow } = useTable({
    columns,
    data: value.map((entry) => ({ submission: entry })),
  })

  return (
    <RepeatableSetCellAccordion
      title={`${value.length} Entr${hasMultipleEntries ? 'ies' : 'y'}`}
      isOpen={isVisible}
      onChange={toggleVisibility}
    >
      <div className={classes.entriesWrapper}>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1
          prepareRow(row)
          return (
            <React.Fragment key={row.id}>
              {row.cells.map((cell) => {
                const cellValue = cell.render('Cell')
                if (!cellValue) return null
                return (
                  <div className={classes.cellRowWrapper} key={cell.column.id}>
                    <span>
                      <Typography color="textSecondary" variant="body2">
                        {cell.column.headerText}:
                      </Typography>
                    </span>
                    <span className={classes.cellValueWrapper}>
                      {cellValue}
                    </span>
                  </div>
                )
              })}
              {!isLast && <Divider className={classes.divider} />}
            </React.Fragment>
          )
        })}
      </div>
    </RepeatableSetCellAccordion>
  )
}

export default React.memo<Props>(RepeatableSetCell)
