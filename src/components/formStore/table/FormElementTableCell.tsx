import * as React from 'react'
import { Link, Typography } from '@mui/material'
import { localisationService } from '@oneblink/apps'
import {
  APINSWTypes,
  ArcGISTypes,
  FormTypes,
  GeoscapeTypes,
  GoogleTypes,
  MiscTypes,
  PointTypes,
  SubmissionTypes,
} from '@oneblink/types'
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

type Props = {
  formElement: FormTypes.FormElement
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined
  allowCopy: boolean
}

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

    case 'arcGISWebMap': {
      const arcGISWebMapElementValue = unknown as
        | ArcGISTypes.ArcGISWebMapElementValue
        | undefined
      if (!arcGISWebMapElementValue?.snapshotImages?.length) {
        break
      }
      return (
        <FilesElementDataTableCellContent
          value={arcGISWebMapElementValue.snapshotImages}
        />
      )
    }

    case 'textarea': {
      if (typeof unknown !== 'string') {
        break
      }
      return (
        <>
          <span
            style={{
              whiteSpace: 'pre-line',
            }}
          >
            {unknown}
          </span>
          <TableCellCopyButton isHidden={!allowCopy} text={unknown} />
        </>
      )
    }

    case 'date': {
      if (typeof unknown !== 'string') {
        break
      }
      const date = localisationService.generateDate({
        daysOffset: undefined,
        value: unknown,
      })
      if (!date) {
        break
      }
      const text = localisationService.formatDate(date)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'time': {
      if (typeof unknown !== 'string') {
        break
      }
      const date = new Date(unknown)
      if (isNaN(date.getTime())) {
        break
      }
      const { time: timeFormat } = localisationService.getDateFnsFormats()
      const text = format(date, timeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'datetime': {
      if (typeof unknown !== 'string') {
        break
      }
      const date = new Date(unknown)
      if (isNaN(date.getTime())) {
        break
      }
      const { shortDateTime: shortDateTimeFormat } =
        localisationService.getDateFnsFormats()
      const text = format(date, shortDateTimeFormat)
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'number': {
      if (typeof unknown !== 'number') {
        break
      }
      const text = localisationService.formatNumber(unknown)
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
        if (
          !Array.isArray(unknown) ||
          !unknown.length ||
          typeof unknown[0] !== 'string'
        ) {
          break
        }
        const text = (unknown as string[])
          .map((selection) => getSelectedOptionLabel(formElement, selection))
          .join(', ')
        return (
          <>
            <MultiSelectFormElementTableCellContent
              value={unknown}
              formElement={formElement}
            />
            <TableCellCopyButton isHidden={!allowCopy} text={text} />
          </>
        )
      } else {
        if (typeof unknown !== 'string') {
          break
        }
        const text = getSelectedOptionLabel(formElement, unknown)
        return (
          <>
            {text}
            <TableCellCopyButton isHidden={!allowCopy} text={text} />
          </>
        )
      }
    }

    case 'email': {
      if (typeof unknown !== 'string') {
        break
      }
      return (
        <>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={`mailto:${unknown}`}
          >
            {unknown}
          </Link>
          <TableCellCopyButton isHidden={!allowCopy} text={unknown} />
        </>
      )
    }
    case 'telephone': {
      if (typeof unknown !== 'string') {
        break
      }
      return (
        <>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={`tel:${unknown}`}
          >
            {unknown}
          </Link>
          <TableCellCopyButton isHidden={!allowCopy} text={unknown} />
        </>
      )
    }
    case 'text':
    case 'bsb':
    case 'barcodeScanner': {
      if (typeof unknown !== 'string') {
        break
      }
      return (
        <>
          {unknown}
          <TableCellCopyButton isHidden={!allowCopy} text={unknown} />
        </>
      )
    }

    case 'files': {
      const value = unknown as React.ComponentProps<
        typeof FilesElementDataTableCellContent
      >['value']
      if (
        !Array.isArray(value) ||
        !value.length ||
        typeof value[0]?.fileName !== 'string'
      ) {
        break
      }
      return <FilesElementDataTableCellContent value={value} />
    }

    case 'calculation': {
      if (typeof unknown !== 'number') {
        break
      }
      const text = formElement.displayAsCurrency
        ? localisationService.formatCurrency(unknown)
        : localisationService.formatNumber(unknown)
      return (
        <>
          {text}
          <TableCellCopyButton
            isHidden={!allowCopy}
            text={unknown.toString()}
          />
        </>
      )
    }

    case 'civicaStreetName': {
      const value = unknown as {
        formattedStreet: string
      }
      if (typeof value?.formattedStreet !== 'string') {
        break
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
      if (typeof value?.emailAddress !== 'string') {
        break
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
      const value = unknown as GeoscapeTypes.GeoscapeAddress
      if (typeof value.addressId !== 'string') {
        break
      }
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

    case 'pointCadastralParcel': {
      const value = unknown as PointTypes.PointCadastralParcelResponse
      const parcelId = value?.parcelBundle?.[0]?.parcelId
      if (typeof parcelId !== 'string') {
        break
      }
      return (
        <>
          {parcelId}
          <TableCellCopyButton isHidden={!allowCopy} text={parcelId} />
        </>
      )
    }

    case 'pointAddress': {
      const value = unknown as PointTypes.PointAddress
      if (typeof value.addressId !== 'string') {
        break
      }
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

    case 'pointAddressV3': {
      const value =
        unknown as PointTypes.PointAddressV3GetAddressDetailsResponse
      if (typeof value.properties?.addressId !== 'string') {
        break
      }
      const fullAddress = value?.properties?.formattedAddress || (
        <>
          NSW Point Address ID: <i>{value.properties?.addressId}</i>
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

    case 'googleAddress': {
      const value = unknown as GoogleTypes.GoogleMapsAddress
      const fullAddress = value?.formatted_address || (
        <>
          Google Address: <i>{value?.place_id}</i>
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
      if (typeof unknown !== 'boolean') {
        break
      }
      const text = unknown ? 'Yes' : 'No'
      return (
        <>
          {text}
          <TableCellCopyButton isHidden={!allowCopy} text={text} />
        </>
      )
    }

    case 'abn': {
      const value = unknown as MiscTypes.ABNRecord
      if (!value.ABN || !value.entityType) {
        break
      }
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
    case 'apiNSWLiquorLicence': {
      const value = unknown as APINSWTypes.LiquorLicenceDetails
      const licenceNumber =
        `${value.licenceDetail?.licenceNumber} | ${value.licenceDetail?.licenceName}`.trim()
      if (!licenceNumber) {
        break
      }
      return (
        <>
          {licenceNumber}
          <TableCellCopyButton isHidden={!allowCopy} text={licenceNumber} />
        </>
      )
    }

    case 'lookupButton':
    case 'html':
    case 'form':
    case 'infoPage':
    case 'captcha':
    case 'image':
    case 'heading':
    case 'summary':
    case 'freshdeskDependentField':
    case 'compliance': {
      return null
    }

    default: {
      const never: never = formElement
      console.warn(
        'Unsupported element type in Submission Data rendering',
        never,
      )
      return null
    }
  }

  return <>{JSON.stringify(unknown)}</>
}

export default React.memo(FormElementTableCell)
