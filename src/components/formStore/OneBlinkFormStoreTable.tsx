import * as React from 'react'
import clsx from 'clsx'
import { styled, Tooltip } from '@mui/material'
import { flexRender } from '@tanstack/react-table'
import { formStoreService } from '../../apps'
import { IsHoveringProvider } from '../../hooks/useIsHovering'
import HeaderCellMoreButton from './table/HeaderCellMoreButton'
import useFormStoreTableContext from './useFormStoreTableContext'
import MaterialIcon from '../MaterialIcon'

const SortingIcon = styled(MaterialIcon)(({ theme }) => ({
  transition: theme.transitions.create('transform'),
}))

const Table = styled('div')(({ theme }) => ({
  display: 'inline-block',
  backgroundColor: theme.palette.background.paper,
  fontSize: theme.typography.body2.fontSize,
  '& .ob-form-store-table-row__alternate': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .tc': {
    padding: theme.spacing(1),
    borderBottom: '1px solid',
    borderBottomColor: theme.palette.divider,
    display: 'flex',
    alignItems: 'center',
    '&.is-clickable': {
      cursor: 'pointer',
      transition: theme.transitions.create('transform'),
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  '& .td': {
    position: 'relative',
    borderRight: '1px solid',
    borderRightColor: theme.palette.divider,
    overflowX: 'hidden',
    // minus 1 to cater for the border
    minHeight: `${parseInt(theme.spacing(5.5)) - 1}px`,
    '&.is-resizing': {
      borderRightStyle: 'dashed',
    },
  },
  '& .th': {
    position: 'relative',
    fontWeight: theme.typography.fontWeightBold,
    paddingRight: 0,
    borderBottomWidth: '2px',
    '& .th-content': {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRight: '1px solid',
      borderRightColor: theme.palette.divider,
      paddingRight: theme.spacing(),
      '& .th-label': {
        display: 'inline-flex',
        alignItems: 'center',
        '& .th-icon': {
          marginLeft: theme.spacing(),
        },
      },
    },
    '& .resizer': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      borderLeftStyle: 'solid',
      borderRightStyle: 'solid',
      borderColor: theme.palette.divider,
      paddingTop: theme.spacing(),
      paddingBottom: theme.spacing(),
      paddingRight: `calc(${theme.spacing(1)} + 1px)`,
      position: 'absolute',
      right: 0,
      top: theme.spacing(0.5),
      bottom: theme.spacing(0.5),
      transform: `translateX(calc(${theme.spacing(0.5)} + 1px))`,
      cursor: 'col-resize',
      zIndex: 1,
      // prevents from scrolling while dragging on touch devices
      touchAction: 'none',
      '&:hover': {
        borderWidth: '1px',
      },
      '&.is-resizing': {
        borderWidth: '1px',
        borderColor: theme.palette.grey[700],
      },
    },
  },
}))

const HeaderRow = styled('div')(() => ({
  display: 'flex',
}))

const CellRow = styled('div')(() => ({
  display: 'flex',
}))

function OneBlinkFormStoreTable() {
  const {
    getHeaderGroups,
    getCoreRowModel,
    getFlatHeaders,
    getState,
    onChangeParameters,
  } = useFormStoreTableContext()

  const [parentHeaderGroup] = getHeaderGroups()
  const rows = getCoreRowModel().rows

  const columnSizingInfo = getState().columnSizingInfo
  const columnSizing = getState().columnSizing
  const visibleColumns = getState().columnVisibility

  /**
   * Pinched from
   * https://tanstack.com/table/latest/docs/framework/react/examples/column-resizing-performant
   * Instead of calling `column.getSize()` on every render for every header and
   * especially every data cell (very expensive), we will calculate all column
   * sizes at once at the root table level in a useMemo and pass the column
   * sizes down as CSS variables to the <table> element.
   */

  const columnSizeVars = React.useMemo(() => {
    // we want the memo to recalculate if these change, dropping them here so the linter doesn't complain about unused dependencies
    /* eslint-disable @typescript-eslint/no-unused-expressions */
    columnSizingInfo
    columnSizing
    /* eslint-enable @typescript-eslint/no-unused-expressions */
    const headers = getFlatHeaders()
    const colSizes: { [key: string]: number } = {}
    for (const header of headers) {
      colSizes[`--header-${header.id}-size`] = header.getSize()
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return colSizes
    // `visibleColumns` is not actually used here, but is required as a dependency
    // to force a re-calculation of the memo when the columns are hidden/shown
  }, [getFlatHeaders, columnSizingInfo, columnSizing, visibleColumns])

  if (!parentHeaderGroup) {
    return null
  }

  const rowBackground = { alternate: false }

  return (
    <>
      <Table className="ob-form-store-table" style={{ ...columnSizeVars }}>
        <div className="thead">
          <HeaderRow className="tr ob-form-store-table-header-row">
            {
              // Loop over the headers in each row
              parentHeaderGroup.headers.map((header) => {
                const sortingProperty =
                  header.column.columnDef.meta?.sorting?.property
                const sortingDirection = header.column.getIsSorted()

                if (!header.column.getIsVisible()) {
                  return null
                }

                return (
                  <Tooltip
                    title={header.column.columnDef?.meta?.tooltip || ''}
                    arrow
                    key={header.id}
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: 'drawer',
                        },
                      },
                    }}
                  >
                    <div
                      className={clsx('th tc ob-form-store-table-header-cell', {
                        'is-clickable': !!sortingProperty,
                      })}
                      onClick={
                        sortingProperty
                          ? () => {
                            onChangeParameters(
                              (
                                currentParameters: formStoreService.FormStoreParameters,
                              ) => {
                                const sortingMeta =
                                  header.column.columnDef.meta?.sorting
                                    ?.property
                                if (!sortingMeta) {
                                  return currentParameters
                                }
                                switch (sortingDirection) {
                                  case 'asc': {
                                    return {
                                      ...currentParameters,
                                      sorting: [
                                        {
                                          property: sortingMeta,
                                          direction: 'descending',
                                        },
                                      ],
                                    }
                                  }
                                  case 'desc': {
                                    return {
                                      ...currentParameters,
                                      sorting: undefined,
                                    }
                                  }
                                  default: {
                                    return {
                                      ...currentParameters,
                                      sorting: [
                                        {
                                          property: sortingMeta,
                                          direction: 'ascending',
                                        },
                                      ],
                                    }
                                  }
                                }
                              },
                              false,
                            )
                          }
                          : undefined
                      }
                      style={{
                        width: `calc(var(--header-${header?.id}-size) * 1px)`,
                      }}
                    >
                      <IsHoveringProvider className="th-content">
                        <div className="th-label">
                          <span>
                            {typeof header.column.columnDef?.header === 'string'
                              ? header.column.columnDef?.header
                              : ''}
                          </span>
                          {sortingDirection && (
                            <SortingIcon
                              fontSize="small"
                              color="primary"
                              sx={
                                sortingDirection === 'asc'
                                  ? {
                                    transform: 'rotate(180deg)',
                                  }
                                  : undefined
                              }
                              className="th-icon"
                            >
                              arrow_downward
                            </SortingIcon>
                          )}

                          {header.column.columnDef.meta?.filter?.isInvalid ? (
                            <Tooltip
                              title={
                                header.column.columnDef.meta?.filter
                                  ?.validationMessage || ''
                              }
                            >
                              <MaterialIcon
                                fontSize="small"
                                color="error"
                                className="th-icon"
                              >
                                warning
                              </MaterialIcon>
                            </Tooltip>
                          ) : header.column.columnDef.meta?.filter?.value ? (
                            <MaterialIcon
                              fontSize="small"
                              color="primary"
                              className="th-icon"
                            >
                              filter_list
                            </MaterialIcon>
                          ) : null}
                        </div>
                        <HeaderCellMoreButton
                          header={header}
                          onHide={() => header.column.toggleVisibility()}
                        />
                        <div
                          className={clsx('resizer', {
                            'is-resizing': header.column.getIsResizing(),
                          })}
                          onClick={(event) => {
                            event.stopPropagation()
                          }}
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                        />
                      </IsHoveringProvider>
                    </div>
                  </Tooltip>
                )
              })
            }
          </HeaderRow>
        </div>
        <div className="tbody">
          {
            // Loop over the table rows
            rows.map((row, index) => {
              if (
                rows[index - 1]?.original.submissionId !==
                row.original.submissionId
              ) {
                rowBackground.alternate = !rowBackground.alternate
              }
              return (
                // Apply the row props
                <CellRow
                  key={row.id}
                  className={clsx('tr ob-form-store-table-row', {
                    'ob-form-store-table-row__alternate': rowBackground.alternate,
                  })}
                >
                  {
                    // Loop over the rows cells
                    row.getVisibleCells().map((cell) => {
                      // Apply the cell props
                      return (
                        <IsHoveringProvider
                          key={cell.column.id}
                          className={clsx(
                            'td tc ob-form-store-table-row-cell',
                            {
                              'is-resizing': cell.column.getIsResizing(),
                            },
                          )}
                          style={{ width: `calc(var(--col-${cell.column.id}-size) * 1px)` }}
                        >
                          {
                            // Render the cell contents
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          }
                        </IsHoveringProvider>
                      )
                    })
                  }
                </CellRow>
              )
            })
          }
        </div>
      </Table>
    </>
  )
}

/**
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkFormStoreTable)
