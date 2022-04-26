import * as React from 'react'
import { TableInstance } from 'react-table'
import clsx from 'clsx'
import { Box, Paper, TableContainer, Tooltip } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  FilterList as FilterListIcon,
  Warning as WarningIcon,
  ArrowDownward as SortingIcon,
} from '@mui/icons-material'
import { SubmissionTypes } from '@oneblink/types'
import { IsHoveringProvider } from '../../../hooks/useIsHovering'
import { NoResourcesYet } from '../../NoResourcesYet'
import FormStoreIcon from '../FormStoreIcon'
import HeaderCellMoreButton from './HeaderCellMoreButton'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'
import { formStoreService } from '@oneblink/apps'

const useStyles = makeStyles((theme) => ({
  tooltip: {
    zIndex: theme.zIndex.drawer,
  },
  sortingIcon: {
    transition: theme.transitions.create('transform'),
  },
  sortingIconDescending: {
    transform: 'rotate(180deg)',
  },
  table: {
    display: 'inline-block',
    '& .tbody .tr:last-child .tc': {
      borderBottom: 0,
    },
    '& .tc': {
      padding: theme.spacing(1),
      borderBottomColor: theme.palette.divider,
      borderBottom: '1px solid',
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
  },
}))

type FormStoreTableInstance = TableInstance<SubmissionTypes.FormStoreRecord>

function FormStoreTable({
  getTableProps,
  getTableBodyProps,
  headerGroups,
  rows,
  prepareRow,
  isEmptyResults,
  onChangeFilters,
}: {
  getTableProps: FormStoreTableInstance['getTableProps']
  getTableBodyProps: FormStoreTableInstance['getTableBodyProps']
  headerGroups: FormStoreTableInstance['headerGroups']
  rows: FormStoreTableInstance['rows']
  prepareRow: FormStoreTableInstance['prepareRow']
  isEmptyResults: boolean
  onChangeFilters: OnChangeFilters<formStoreService.FormStoreFilters>
}) {
  const classes = useStyles()

  return (
    <>
      <Paper>
        <TableContainer>
          <div className={classes.table} {...getTableProps()}>
            <div className="thead">
              {
                // Loop over the header rows
                headerGroups.map((headerGroup) => (
                  // Apply the header row props
                  <div {...headerGroup.getHeaderGroupProps()} className="tr">
                    {
                      // Loop over the headers in each row
                      headerGroup.headers.map((headerGroup) => {
                        const sortingProperty = headerGroup.sorting?.property
                        const sortingDirection = headerGroup.sorting?.direction

                        return (
                          <Tooltip
                            title={headerGroup.tooltip || ''}
                            arrow
                            key={headerGroup.id}
                            classes={{
                              popper: classes.tooltip,
                            }}
                          >
                            <div
                              className={clsx('th tc', {
                                'is-clickable': !!sortingProperty,
                              })}
                              onClick={
                                sortingProperty
                                  ? () => {
                                      onChangeFilters((currentFilters) => {
                                        switch (sortingDirection) {
                                          case 'ascending': {
                                            return {
                                              ...currentFilters,
                                              sorting: [
                                                {
                                                  property: sortingProperty,
                                                  direction: 'descending',
                                                },
                                              ],
                                            }
                                          }
                                          case 'descending': {
                                            return {
                                              ...currentFilters,
                                              sorting: undefined,
                                            }
                                          }
                                          default: {
                                            return {
                                              ...currentFilters,
                                              sorting: [
                                                {
                                                  property: sortingProperty,
                                                  direction: 'ascending',
                                                },
                                              ],
                                            }
                                          }
                                        }
                                      }, false)
                                    }
                                  : undefined
                              }
                              // Apply the header cell props
                              {...headerGroup.getHeaderProps()}
                            >
                              <IsHoveringProvider className="th-content">
                                <div className="th-label">
                                  <span>{headerGroup.headerText}</span>
                                  {sortingDirection && (
                                    <SortingIcon
                                      fontSize="small"
                                      color="primary"
                                      className={clsx(
                                        'th-icon',
                                        classes.sortingIcon,
                                        {
                                          [classes.sortingIconDescending]:
                                            sortingDirection === 'descending',
                                        },
                                      )}
                                    />
                                  )}
                                  {headerGroup.filter?.isInvalid ? (
                                    <Tooltip
                                      title={
                                        headerGroup.filter?.validationMessage ||
                                        ''
                                      }
                                    >
                                      <WarningIcon
                                        fontSize="small"
                                        color="error"
                                        className="th-icon"
                                      />
                                    </Tooltip>
                                  ) : headerGroup.filter?.value ? (
                                    <FilterListIcon
                                      fontSize="small"
                                      color="primary"
                                      className="th-icon"
                                    />
                                  ) : null}
                                </div>
                                <HeaderCellMoreButton
                                  headerGroup={headerGroup}
                                  onHide={headerGroup.toggleHidden}
                                />
                                <div
                                  {...headerGroup.getResizerProps()}
                                  className={clsx('resizer', {
                                    'is-resizing': headerGroup.isResizing,
                                  })}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                  }}
                                />
                              </IsHoveringProvider>
                            </div>
                          </Tooltip>
                        )
                      })
                    }
                  </div>
                ))
              }
            </div>
            {!isEmptyResults ? (
              <div {...getTableBodyProps()} className="tbody">
                {
                  // Loop over the table rows
                  rows.map((row) => {
                    // Prepare the row for display
                    prepareRow(row)
                    return (
                      // Apply the row props
                      <div {...row.getRowProps()} className="tr">
                        {
                          // Loop over the rows cells
                          row.cells.map((cell) => {
                            // Apply the cell props
                            return (
                              <IsHoveringProvider
                                {...cell.getCellProps()}
                                className={clsx('td tc', {
                                  'is-resizing': cell.column.isResizing,
                                })}
                              >
                                {
                                  // Render the cell contents
                                  cell.render('Cell')
                                }
                              </IsHoveringProvider>
                            )
                          })
                        }
                      </div>
                    )
                  })
                }
              </div>
            ) : (
              <Box padding={2} />
            )}
          </div>
        </TableContainer>
      </Paper>

      {isEmptyResults && (
        <NoResourcesYet
          IconComponent={FormStoreIcon}
          title="No Records Found..."
        >
          There are no Submissions matching your filters.
        </NoResourcesYet>
      )}
    </>
  )
}

export default React.memo(FormStoreTable)
