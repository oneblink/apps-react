import * as React from 'react'
import { saveAs } from 'file-saver'
import { Chip, CircularProgress, Grid } from '@mui/material'
import ErrorSnackbar from '../../ErrorSnackbar'
import { UnorderedList, ListItem } from '../../Lists'
import { FormElementWithOptions } from '@oneblink/types/typescript/forms'
import { getCognitoIdToken } from '@oneblink/apps/dist/services/cognito'
import tenants from '@oneblink/apps/dist/tenants'
import MaterialIcon from '../../MaterialIcon'

async function fetchFile(url: string) {
  const idToken = await getCognitoIdToken()
  const safeUrl = new URL(tenants.current.apiOrigin)
  const unsafeUrl = new URL(url)
  safeUrl.pathname = unsafeUrl.pathname
  safeUrl.search = unsafeUrl.search
  const response = await fetch(safeUrl.href, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Unable to download file. HTTP Status Code: ${response.status}`,
    )
  }

  return await response.blob()
}

export function FileChip({
  file: { fileName, url, data },
}: {
  file: {
    fileName: string
    url?: string
    isPrivate?: boolean
    data?: string
  }
}) {
  const [{ isDownloading, error }, setState] = React.useState<{
    error?: Error
    isDownloading: boolean
  }>({
    isDownloading: false,
  })
  const clearError = React.useCallback(() => {
    setState({
      isDownloading: false,
    })
  }, [])
  const handleDownload = React.useCallback(async () => {
    try {
      setState({
        isDownloading: true,
      })

      if (url) {
        const blob = await fetchFile(url)
        saveAs(blob, fileName)
      } else if (data) {
        saveAs(data, fileName)
      }

      setState({
        isDownloading: false,
      })
    } catch (error) {
      setState({
        isDownloading: false,
        error: error as Error,
      })
    }
  }, [data, fileName, url])
  return (
    <>
      <Chip
        label={fileName}
        deleteIcon={<MaterialIcon>save_alt</MaterialIcon>}
        onDelete={handleDownload}
        variant="outlined"
        icon={
          isDownloading ? (
            <CircularProgress size={16} />
          ) : (
            <MaterialIcon>attach_file</MaterialIcon>
          )
        }
      />
      <ErrorSnackbar open={!!error} onClose={clearError}>
        <span data-cypress="download-legacy-file-error-message">
          {error && error.message}
        </span>
      </ErrorSnackbar>
    </>
  )
}

export function FilesElementDataTableCellContent({
  value,
}: {
  value: Array<{
    fileName: string
    url?: string | undefined
    isPrivate?: boolean | undefined
    data?: string | undefined
  }>
}) {
  return (
    <Grid container spacing={1}>
      {value.map((file, index) => {
        return (
          <Grid size={{ xs: 12 }} key={index}>
            <FileChip file={file} />
          </Grid>
        )
      })}
    </Grid>
  )
}

export function MultiSelectFormElementTableCellContent({
  value,
  formElement,
}: {
  value: string[]
  formElement: FormElementWithOptions
}) {
  return (
    <UnorderedList disablePadding>
      {value.map((selection, index) => {
        const label = getSelectedOptionLabel(formElement, selection)
        return <ListItem key={index}>{label?.toString()}</ListItem>
      })}
    </UnorderedList>
  )
}

export function getSelectedOptionLabel(
  formElement: FormElementWithOptions,
  value: string,
) {
  const selectedOption = (formElement.options || []).find(
    (opt) => opt.value === value,
  )
  return selectedOption ? selectedOption.label : value
}
