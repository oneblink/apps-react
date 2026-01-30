import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { ColumnMeta } from '@tanstack/react-table'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { format } from 'date-fns'
import { localisationService } from '../../../apps'
import { FiltersDatePicker, FiltersDateTimePicker } from './Pickers'

const StyledTextField = styled(TextField)(() => ({
  width: '350px',
}))

type Props = {
  filter: NonNullable<ColumnMeta<FormStoreRecord, unknown>['filter']>
}

const shortDateFormat = localisationService.getDateFnsFormats().shortDate

function ColumnFilters({ filter }: Props) {
  switch (filter.type) {
    case 'SUBMISSION_ID': {
      return (
        <StyledTextField
          autoFocus
          variant="outlined"
          margin="dense"
          size="small"
          label="Filter"
          type="text"
          fullWidth
          value={filter.value?.$eq || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            filter.onChange(
              e.target.value
                ? {
                  $eq: e.target.value,
                }
                : undefined,
              true,
            )
          }}
        />
      )
    }
    case 'TEXT': {
      return (
        <StyledTextField
          autoFocus
          variant="outlined"
          margin="dense"
          size="small"
          label="Filter"
          type="text"
          fullWidth
          value={filter.value?.$regex || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            filter.onChange(
              e.target.value
                ? {
                  $regex: e.target.value,
                  // hard code case in-sensitive and multi-line searching
                  $options: 'im',
                }
                : undefined,
              true,
            )
          }}
        />
      )
    }
    case 'NUMBER': {
      return (
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <TextField
              autoFocus
              variant="outlined"
              margin="dense"
              size="small"
              label="More Than Or Equal To"
              type="number"
              fullWidth
              value={filter.value?.$gte?.toString() || ''}
              onChange={(e) => {
                const newValue = e.target.value
                  ? parseInt(e.target.value)
                  : undefined
                filter.onChange(
                  typeof filter.value?.$lte === 'number' ||
                    newValue !== undefined
                    ? {
                      ...filter.value,
                      $gte: newValue,
                    }
                    : undefined,
                  true,
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              variant="outlined"
              margin="dense"
              size="small"
              label="Less Than Or Equal To"
              type="number"
              fullWidth
              value={filter.value?.$lte?.toString() || ''}
              onChange={(e) => {
                const newValue = e.target.value
                  ? parseInt(e.target.value)
                  : undefined
                filter.onChange(
                  typeof filter.value?.$gte === 'number' ||
                    newValue !== undefined
                    ? {
                      ...filter.value,
                      $lte: newValue,
                    }
                    : undefined,
                  true,
                )
              }}
            />
          </Grid>
        </Grid>
      )
    }
    case 'DATE': {
      return (
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <FiltersDatePicker
              label="After"
              maxDate={filter.value?.$lte}
              value={filter.value?.$gte}
              renderHelperText={(errorType) => {
                if (errorType === 'maxDate' && filter.value?.$lte) {
                  return `Must be before "${format(
                    new Date(filter.value?.$lte),
                    shortDateFormat,
                  )}"`
                }
              }}
              onChange={(newDate) =>
                filter.onChange(
                  filter.value?.$lte || !!newDate
                    ? {
                      ...filter.value,
                      $gte: newDate,
                    }
                    : undefined,
                  false,
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FiltersDatePicker
              label="Before"
              value={filter.value?.$lte}
              minDate={filter.value?.$gte}
              renderHelperText={(errorType) => {
                if (errorType === 'minDate' && filter.value?.$gte) {
                  return `Must be after "${format(
                    new Date(filter.value?.$gte),
                    shortDateFormat,
                  )}"`
                }
              }}
              onChange={(newDate) =>
                filter.onChange(
                  filter.value?.$gte || !!newDate
                    ? {
                      ...filter.value,
                      $lte: newDate,
                    }
                    : undefined,
                  false,
                )
              }
            />
          </Grid>
        </Grid>
      )
    }
    case 'DATETIME': {
      return (
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <FiltersDateTimePicker
              label="After"
              maxDate={filter.value?.$lte}
              value={filter.value?.$gte}
              renderHelperText={(errorType) => {
                if (errorType === 'maxDate' && filter.value?.$lte) {
                  return `Must be before "${format(
                    new Date(filter.value?.$lte),
                    shortDateFormat,
                  )}"`
                }
              }}
              onChange={(newDate) => {
                filter.onChange(
                  filter.value?.$lte || !!newDate
                    ? {
                      ...filter.value,
                      $gte: newDate,
                    }
                    : undefined,
                  false,
                )
              }
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FiltersDateTimePicker
              label="Before"
              minDate={filter.value?.$gte}
              value={filter.value?.$lte}
              renderHelperText={(errorType) => {
                if (errorType === 'minDate' && filter.value?.$gte) {
                  return `Must be after "${format(
                    new Date(filter.value?.$gte),
                    shortDateFormat,
                  )}"`
                }
              }}
              onChange={(newDate) =>
                filter.onChange(
                  filter.value?.$gte || !!newDate
                    ? {
                      ...filter.value,
                      $lte: newDate,
                    }
                    : undefined,
                  false,
                )
              }
            />
          </Grid>
        </Grid>
      )
    }
    case 'BOOLEAN': {
      return (
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="gender"
            name="gender1"
            value={filter.value?.$eq?.toString() || 'null'}
            onChange={(e) => {
              filter.onChange(
                {
                  $eq: e.target.value === 'true',
                },
                false,
              )
            }}
          >
            <FormControlLabel value="true" control={<Radio />} label="Yes" />
            <FormControlLabel value="false" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
      )
    }
    case 'OPTIONS_SINGLE': {
      return (
        <OptionsTextField
          options={filter.options}
          value={filter.value?.$in}
          onChange={(newValue) => {
            filter.onChange(
              newValue.length
                ? {
                  $in: newValue,
                }
                : undefined,
              false,
            )
          }}
        />
      )
    }
    case 'OPTIONS_MULTIPLE': {
      return (
        <OptionsTextField
          options={filter.options}
          value={filter.value?.$elemMatch?.$in}
          onChange={(newValue) => {
            filter.onChange(
              newValue.length
                ? {
                  $elemMatch: {
                    $in: newValue,
                  },
                }
                : undefined,
              false,
            )
          }}
        />
      )
    }
    default: {
      return null
    }
  }
}

export default React.memo(ColumnFilters)

function OptionsTextField({
  options,
  value,
  onChange,
}: {
  options: FormTypes.ChoiceElementOption[]
  value: string[] | undefined
  onChange: (newValue: string[]) => void
}) {
  return (
    <StyledTextField
      variant="outlined"
      margin="dense"
      size="small"
      label="Filter"
      select
      SelectProps={{
        multiple: true,
        renderValue: (selectedIds: unknown) => {
          return options
            .reduce<string[]>((selectedLabels, option) => {
              if ((selectedIds as string[]).includes(option.value)) {
                selectedLabels.push(option.label)
              }
              return selectedLabels
            }, [])
            .join(', ')
        },
      }}
      fullWidth
      value={value || []}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value as unknown as string[]
        onChange(newValue)
      }}
    >
      {options.map((option) => (
        <MenuItem value={option.value} key={option.value}>
          <Checkbox checked={!!value?.some((v) => v === option.value)} />
          <ListItemText>{option.label}</ListItemText>
        </MenuItem>
      ))}
    </StyledTextField>
  )
}
