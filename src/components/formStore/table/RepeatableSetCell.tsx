import * as React from 'react'
import { Typography, Divider as MuiDivider, styled } from '@mui/material'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useBooleanState from '../../../hooks/useBooleanState'
import generateColumns from './generateColumns'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import RepeatableSetCellAccordion from './RepeatableSetCellAccordion'

const Wrapper = styled('div')({
  width: '100%',
})
const CellRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: theme.spacing(),
  width: '100%',
}))

const CellValue = styled('span')(({ theme }) => ({
  flex: 2,
  marginLeft: theme.spacing(),
  textAlign: 'right',
  width: '100%',
}))

const Divider = styled(MuiDivider)(({ theme }) => ({
  margin: theme.spacing(1, -2),
}))

type Props = {
  value: Array<Record<string, unknown>>
  formElement: FormTypes.RepeatableSetElement
}

const RepeatableSetCell = ({ formElement, value }: Props) => {
  const [isVisible, , , toggleVisibility] = useBooleanState(false)
  const hasMultipleEntries = value.length > 1
  const columns = React.useMemo(
    () =>
      generateColumns({
        onChangeParameters: () => {},
        formElements: formElement.elements,
        parentElementNames: [],
        initialColumns: [],
        allowCopy: false,
        filters: undefined,
        sorting: undefined,
        unwindRepeatableSets: undefined,
      }),
    [formElement.elements],
  )
  // eslint-disable-next-line react-hooks/incompatible-library
  const { getRowModel } = useReactTable({
    columns: columns,
    data: value.map((entry) => ({ submission: entry })),
    getCoreRowModel: getCoreRowModel<SubmissionTypes.FormStoreRecord>(),
  })

  const rows = React.useMemo(() => getRowModel().rows, [getRowModel])

  return (
    <RepeatableSetCellAccordion
      title={`${value.length} Entr${hasMultipleEntries ? 'ies' : 'y'}`}
      isOpen={isVisible}
      onChange={toggleVisibility}
    >
      <Wrapper>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1
          return (
            <React.Fragment key={row.id}>
              {row.getAllCells().map((cell) => {
                const cellValue = cell.getValue()
                if (!cellValue) return null
                return (
                  <CellRow key={cell.column.id}>
                    <span>
                      <Typography color="textSecondary" variant="body2">
                        {cell.column.columnDef.header?.toString() || ''}:
                      </Typography>
                    </span>
                    <CellValue>{cellValue as string}</CellValue>
                  </CellRow>
                )
              })}
              {!isLast && <Divider />}
            </React.Fragment>
          )
        })}
      </Wrapper>
    </RepeatableSetCellAccordion>
  )
}

export default React.memo<Props>(RepeatableSetCell)
