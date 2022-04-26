import * as React from 'react'
import { saveAs } from 'file-saver'
import { Chip, CircularProgress, Grid } from '@mui/material'
import { SaveAlt, AttachFile } from '@mui/icons-material'
import ErrorSnackbar from '../../ErrorSnackbar'
import { UnorderedList, ListItem } from '../../Lists'
import { FormElementWithOptions } from '@oneblink/types/typescript/forms'
import { getCognitoIdToken } from '@oneblink/apps/dist/services/cognito'

async function fetchFile(url: string) {
  const idToken = await getCognitoIdToken()
  const response = await fetch(url, {
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
  file: { fileName, url, isPrivate, data },
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
        if (isPrivate) {
          const blob = await fetchFile(url)
          saveAs(blob, fileName)
        } else {
          saveAs(url, fileName)
        }
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
  }, [data, fileName, isPrivate, url])
  return (
    <>
      <Chip
        label={fileName}
        deleteIcon={<SaveAlt />}
        onDelete={handleDownload}
        variant="outlined"
        icon={isDownloading ? <CircularProgress size={16} /> : <AttachFile />}
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
          <Grid item key={index} xs={12}>
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
        return <ListItem key={index}>{label}</ListItem>
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
