import * as React from 'react'
import clsx from 'clsx'
import { styled, Tooltip } from '@mui/material'
import {
  FilterList as FilterListIcon,
  Warning as WarningIcon,
  ArrowDownward,
} from '@mui/icons-material'
import { IsHoveringProvider } from '../../hooks/useIsHovering'
import HeaderCellMoreButton from './table/HeaderCellMoreButton'
import useFormStoreTableContext from './useFormStoreTableContext'

const SortingIcon = styled(ArrowDownward)(({ theme }) => ({
  transition: theme.transitions.create('transform'),
}))

const Table = styled('div')(({ theme }) => ({
  display: 'inline-block',
  backgroundColor: theme.palette.background.paper,
  fontSize: theme.typography.body2.fontSize,
  '& .thead': {
    backgroundColor: theme.palette.background.paper,
    position: 'sticky',
    zIndex: 1,
    top: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      top: theme.spacing(8),
    },
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

function OneBlinkFormStoreTable() {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups: [headerGroup],
    rows,
    prepareRow,
    onChangeFilters,
  } = useFormStoreTableContext()
  return (
    <>
      <Table {...getTableProps()}>
        <div className="thead">
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
                    PopperProps={{
                      sx: {
                        zIndex: 'drawer',
                      },
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
                              sx={
                                sortingDirection === 'descending'
                                  ? {
                                      transform: 'rotate(180deg)',
                                    }
                                  : undefined
                              }
                              className="th-icon"
                            />
                          )}
                          {headerGroup.filter?.isInvalid ? (
                            <Tooltip
                              title={
                                headerGroup.filter?.validationMessage || ''
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
        </div>
        <div {...getTableBodyProps()} className="tbody">
          {
            // Loop over the table rows
            rows.map((row) => {
              // Prepare the row for display
              prepareRow(row)
              return (
                // Apply the row props
                <div {...row.getRowProps()} key={row.id} className="tr">
                  {
                    // Loop over the rows cells
                    row.cells.map((cell) => {
                      // Apply the cell props
                      return (
                        <IsHoveringProvider
                          {...cell.getCellProps()}
                          key={cell.column.id}
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
      </Table>
    </>
  )
}

export default React.memo(OneBlinkFormStoreTable)
