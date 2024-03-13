import * as React from 'react'
import clsx from 'clsx'
import { styled, Tooltip } from '@mui/material'
import { IsHoveringProvider } from '../../hooks/useIsHovering'
import HeaderCellMoreButton from './table/HeaderCellMoreButton'
import useFormStoreTableContext from './useFormStoreTableContext'
import { Color } from '../../types/mui-color'
import MaterialIcon from '../MaterialIcon'

const StyledIcon = styled(
  ({
    icon,
    ...props
  }: {
    icon: string
  } & React.ComponentProps<typeof MaterialIcon>) => (
    <MaterialIcon {...props}>{icon}</MaterialIcon>
  ),
)<{
  color: Color
  icon: string
  sortingDirection?: 'ascending' | 'descending'
}>(({ theme, color, sortingDirection }) => ({
  transition: theme.transitions.create('transform'),
  transform: sortingDirection === 'ascending' ? 'rotate(180deg)' : undefined,
  fontSize: theme.typography.h6.fontSize + '!important',
  color: theme.palette[color].main,
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
    headerGroups: [parentHeaderGroup],
    rows,
    prepareRow,
    onChangeParameters,
  } = useFormStoreTableContext()

  if (!parentHeaderGroup) {
    return null
  }

  let alternateBackground = false

  return (
    <>
      <Table {...getTableProps()} className="ob-form-store-table">
        <div className="thead">
          <div
            {...parentHeaderGroup.getHeaderGroupProps()}
            className="tr ob-form-store-table-header-row"
          >
            {
              // Loop over the headers in each row
              parentHeaderGroup.headers.map((headerGroup) => {
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
                      className={clsx('th tc ob-form-store-table-header-cell', {
                        'is-clickable': !!sortingProperty,
                      })}
                      onClick={
                        sortingProperty
                          ? () => {
                              onChangeParameters((currentParameters) => {
                                switch (sortingDirection) {
                                  case 'ascending': {
                                    return {
                                      ...currentParameters,
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
                                      ...currentParameters,
                                      sorting: undefined,
                                    }
                                  }
                                  default: {
                                    return {
                                      ...currentParameters,
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
                            <StyledIcon
                              className="th-icon"
                              sortingDirection={sortingDirection}
                              color="primary"
                              icon="arrow_downward"
                            />
                          )}
                          {headerGroup.filter?.isInvalid ? (
                            <Tooltip
                              title={
                                headerGroup.filter?.validationMessage || ''
                              }
                            >
                              <StyledIcon
                                color="error"
                                icon="warning"
                                className="th-icon"
                              />
                            </Tooltip>
                          ) : headerGroup.filter?.value ? (
                            <StyledIcon
                              color="primary"
                              icon="filter_list"
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
            rows.map((row, index) => {
              if (
                rows[index - 1]?.original.submissionId !==
                row.original.submissionId
              ) {
                alternateBackground = !alternateBackground
              }
              // Prepare the row for display
              prepareRow(row)
              return (
                // Apply the row props
                <div
                  {...row.getRowProps()}
                  key={row.id}
                  className={clsx('tr ob-form-store-table-row', {
                    'ob-form-store-table-row__alternate': alternateBackground,
                  })}
                >
                  {
                    // Loop over the rows cells
                    row.cells.map((cell) => {
                      // Apply the cell props
                      return (
                        <IsHoveringProvider
                          {...cell.getCellProps()}
                          key={cell.column.id}
                          className={clsx(
                            'td tc ob-form-store-table-row-cell',
                            {
                              'is-resizing': cell.column.isResizing,
                            },
                          )}
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

/**
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkFormStoreTable)
