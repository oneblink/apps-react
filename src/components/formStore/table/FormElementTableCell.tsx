import * as React from 'react'
import { Link, Typography } from '@mui/material'
import { localisationService } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { abnService } from '@oneblink/sdk-core'
import {
  FileChip,
  FilesElementDataTableCellContent,
  MultiSelectFormElementTableCellContent,
  getSelectedOptionLabel,
} from '../ElementDisplay'
import RepeatableSetCell from './RepeatableSetCell'
import TableCellCopyButton from './TableCellCopyButton'
import { format } from 'date-fns'

type Props = {
  formElement: FormTypes.FormElement
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined
  allowCopy: boolean
}

const {
  shortDate: shortDateFormat,
  time: timeFormat,
  shortDateTime: shortDateTimeFormat,
} = localisationService.getDateFnsFormats()

function FormElementTableCell({ formElement, submission, allowCopy }: Props) {
  if (formElement.type === 'page' || formElement.type === 'section') {
    return null
  }
  const value = submission?.[formElement.name]
  if (value === undefined || value === null) {
    return null
  }

  switch (formElement.type) {
    case 'repeatableSet': {
      return <RepeatableSetCell formElement={formElement} value={value} />
    }

    case 'location': {
      if (!value.latitude || !value.longitude) {
        break
      }

      const latLong = `${value.latitude},${value.longitude}`
      return (
        <>
          <div>
            <Typography variant="inherit" component="p">
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={`https://maps.google.com/?q=${latLong}`}
              >
                View in Google Maps
              </Link>
            </Typography>
            <Typography variant="inherit" component="p" color="textSecondary">
              Latitude: {value.latitude}
            </Typography>
            <Typography variant="inherit" component="p" color="textSecondary">
              Longitude: {value.longitude}
            </Typography>
          </div>
          <TableCellCopyButton isHidden={!allowCopy} text={latLong} />
        </>
      )
    }

    case 'camera':
    case 'draw': {
      return <FileChip file={value} />
    }

    case 'textarea': {
      return (
        <>
          <span
            style={{
              whiteSpace: 'pre-line',
            }}
          >
            {value}
          </span>
          <TableCellCopyButton isHidden={!allowCopy} text={value} />
        </>
      )
    }

    case 'date': {
      const text = format(new Date(value), shortDateFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'time': {
      const text = format(new Date(value), timeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'datetime': {
      const text = format(new Date(value), shortDateTimeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'number': {
      const text = localisationService.formatNumber(value)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'radio':
    case 'autocomplete':
    case 'checkboxes':
    case 'select': {
      if (
        formElement.type === 'checkboxes' ||
        (formElement.type === 'select' && formElement.multi)
      ) {
        if (!Array.isArray(value) || !value.length) {
          break
        }
        const text = value
          .map((selection) => getSelectedOptionLabel(formElement, selection))
          .join(', ')
        return (
          <>
            <MultiSelectFormElementTableCellContent
              value={value}
              formElement={formElement}
            />
            <TableCellCopyButton isHidden={!allowCopy} text={text} />
          </>
        )
      } else {
        const text = getSelectedOptionLabel(formElement, value)
        return (
          <>
            {text}
            <TableCellCopyButton isHidden={!allowCopy} text={text} />
          </>
        )
      }
    }

    case 'email': {
      return (
        <>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={`mailto:${value}`}
          >
            {value}
          </Link>
          <TableCellCopyButton isHidden={!allowCopy} text={value} />
        </>
      )
    }
    case 'telephone': {
      return (
        <>
          <Link target="_blank" rel="noopener noreferrer" href={`tel:${value}`}>
            {value}
          </Link>
          <TableCellCopyButton isHidden={!allowCopy} text={value} />
        </>
      )
    }
    case 'text':
    case 'bsb':
    case 'barcodeScanner': {
      return (
        <>
          {value}
          <TableCellCopyButton isHidden={!allowCopy} text={value} />
        </>
      )
    }

    case 'files': {
      if (!Array.isArray(value) || !value.length) {
        break
      }
      return <FilesElementDataTableCellContent value={value} />
    }

    case 'calculation': {
      if (formElement.displayAsCurrency) {
        const text = localisationService.formatCurrency(value)
        return (
          <>
            {text}
            <TableCellCopyButton isHidden={!allowCopy} text={value} />
          </>
        )
      } else {
        const text = localisationService.formatNumber(value)
        return (
          <>
            {text}
            <TableCellCopyButton isHidden={!allowCopy} text={value} />
          </>
        )
      }
    }

    case 'civicaStreetName': {
      return (
        <>
          {value.formattedStreet}
          <TableCellCopyButton
            isHidden={!allowCopy}
            text={value.formattedStreet}
          />
        </>
      )
    }

    case 'civicaNameRecord': {
      const text =
        [value?.title, value?.givenName1, value?.familyName]
          .filter((t) => t)
          .join(' ') || value?.emailAddress
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'geoscapeAddress': {
      const fullAddress =
        value.addressDetails && value.addressDetails.formattedAddress ? (
          value.addressDetails.formattedAddress
        ) : (
          <>
            Geoscape Address ID: <i>{value.addressId}</i>
          </>
        )
      return (
        <>
          {fullAddress}
          <TableCellCopyButton isHidden={!allowCopy} text={fullAddress} />
        </>
      )
    }

    case 'pointAddress': {
      const fullAddress =
        value.addressDetails && value.addressDetails.formattedAddress ? (
          value.addressDetails.formattedAddress
        ) : (
          <>
            NSW Point Address ID: <i>{value.addressId}</i>
          </>
        )
      return (
        <>
          {fullAddress}
          <TableCellCopyButton isHidden={!allowCopy} text={fullAddress} />
        </>
      )
    }

    case 'boolean': {
      const text = value ? 'Yes' : 'No'
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'abn': {
      const abnNumber = abnService.displayABNNumberFromABNRecord(value)
      return (
        <>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.abr.business.gov.au/ABN/View/${abnNumber}`}
          >
            {abnNumber} |{' '}
            <i>{abnService.displayBusinessNameFromABNRecord(value)}</i>
          </Link>
          <TableCellCopyButton isHidden={!allowCopy} text={abnNumber} />
        </>
      )
    }

    case 'html':
    case 'form':
    case 'infoPage':
    case 'captcha':
    case 'image':
    case 'heading':
    case 'summary': {
      break
    }

    default: {
      console.warn(
        'Unsupported element type in Submission Data rendering',
        formElement,
      )
    }
  }

  return null
}

export default React.memo(FormElementTableCell)
