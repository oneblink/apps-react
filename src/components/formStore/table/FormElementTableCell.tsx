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
} from '../display/ElementDisplay'
import RepeatableSetCell from './RepeatableSetCell'
import TableCellCopyButton from './TableCellCopyButton'
import { format } from 'date-fns'
import { ABNRecord } from '@oneblink/types/typescript/misc'
import { GeoscapeAddress } from '@oneblink/types/typescript/geoscape'
import { PointAddress } from '@oneblink/types/typescript/point'

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
  const unknown = submission?.[formElement.name]
  if (unknown === undefined || unknown === null) {
    return null
  }

  switch (formElement.type) {
    case 'repeatableSet': {
      if (!Array.isArray(unknown)) {
        break
      }
      return <RepeatableSetCell formElement={formElement} value={unknown} />
    }

    case 'location': {
      const value = unknown as {
        latitude: number
        longitude: number
      }
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
      return (
        <FileChip
          file={unknown as React.ComponentProps<typeof FileChip>['file']}
        />
      )
    }

    case 'textarea': {
      const value = unknown as string
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
      const value = unknown as string
      const text = format(new Date(value), shortDateFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'time': {
      const value = unknown as string
      const text = format(new Date(value), timeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'datetime': {
      const value = unknown as string
      const text = format(new Date(value), shortDateTimeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'number': {
      const value = unknown as number
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
        const value = unknown as string
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
        const value = unknown as string
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
      const value = unknown as string
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
      const value = unknown as string
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
      const value = unknown as string
      return (
        <>
          {value}
          <TableCellCopyButton isHidden={!allowCopy} text={value} />
        </>
      )
    }

    case 'files': {
      const value = unknown as React.ComponentProps<
        typeof FilesElementDataTableCellContent
      >['value']
      if (!Array.isArray(value) || !value.length) {
        break
      }
      return <FilesElementDataTableCellContent value={value} />
    }

    case 'calculation': {
      const value = unknown as number
      if (formElement.displayAsCurrency) {
        const text = localisationService.formatCurrency(value)
        return (
          <>
            {text}
            <TableCellCopyButton
              isHidden={!allowCopy}
              text={value.toString()}
            />
          </>
        )
      } else {
        const text = localisationService.formatNumber(value)
        return (
          <>
            {text}
            <TableCellCopyButton
              isHidden={!allowCopy}
              text={value.toString()}
            />
          </>
        )
      }
    }

    case 'civicaStreetName': {
      const value = unknown as {
        formattedStreet: string
      }
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
      const value = unknown as {
        title?: string
        givenName1?: string
        familyName?: string
        emailAddress: string
      }
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
      const value = unknown as GeoscapeAddress
      const fullAddress = value?.addressDetails?.formattedAddress || (
        <>
          Geoscape Address ID: <i>{value.addressId}</i>
        </>
      )
      return (
        <>
          {fullAddress}
          <TableCellCopyButton
            isHidden={!allowCopy}
            text={fullAddress as string}
          />
        </>
      )
    }

    case 'pointAddress': {
      const value = unknown as PointAddress
      const fullAddress = value?.addressDetails?.formattedAddress || (
        <>
          NSW Point Address ID: <i>{value.addressId}</i>
        </>
      )
      return (
        <>
          {fullAddress}
          <TableCellCopyButton
            isHidden={!allowCopy}
            text={fullAddress as string}
          />
        </>
      )
    }

    case 'boolean': {
      const value = unknown as boolean
      const text = value ? 'Yes' : 'No'
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'abn': {
      const value = unknown as ABNRecord
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
