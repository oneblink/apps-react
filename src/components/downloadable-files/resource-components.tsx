import * as React from 'react'
import { Collapse, Grid, LinearProgress, Tooltip } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import { submissionService } from '@oneblink/apps'
import useLoadDataState from '../../hooks/useLoadDataState'
import OneBlinkAppsErrorOriginalMessage from '../renderer/OneBlinkAppsErrorOriginalMessage'
import clsx from 'clsx'
import { useLayout } from './LayoutProvider'

type Attachment = Awaited<
  ReturnType<typeof submissionService.getPostSubmissionAttachments>
>[number]

export const LoadAndDisplayAttachments = ({
  pdfFileNodes,
  formSubmissionResult,
}: {
  pdfFileNodes?: PDFFileNode[]
  formSubmissionResult: submissionService.FormSubmissionResult
}) => {
  const loadAttachments = React.useCallback(
    () => submissionService.getPostSubmissionAttachments(formSubmissionResult),
    [formSubmissionResult],
  )
  const [attachmentsState] = useLoadDataState(loadAttachments)

  return (
    <>
      <Collapse in={attachmentsState.status === 'LOADING'} unmountOnExit>
        <div className="ob-downloadable-files__loading">
          <div className="ob-list__text-secondary mb-1 has-text-centered">
            Loading Attachments...
          </div>
          <LinearProgress className="ob-progress__downloadable-files" />
        </div>
      </Collapse>
      <Collapse in={attachmentsState.status === 'ERROR'} unmountOnExit>
        {!!pdfFileNodes?.length && (
          <>
            <OnlyPDFDisplay className="ob-downloadable-files__error-pdf">
              {pdfFileNodes}
            </OnlyPDFDisplay>
          </>
        )}

        <div className="ob-downloadable-files__error has-text-centered">
          <MaterialIcon className="has-text-danger icon-large">
            error
          </MaterialIcon>
          <OneBlinkAppsErrorOriginalMessage
            error={
              attachmentsState.status === 'ERROR'
                ? attachmentsState.error
                : undefined
            }
          />
        </div>
      </Collapse>
      <Collapse in={attachmentsState.status === 'SUCCESS'} unmountOnExit>
        <DownloadableFilesDisplay
          attachments={
            attachmentsState.status === 'SUCCESS' ? attachmentsState.result : []
          }
          pdfFileNodes={pdfFileNodes}
        />
      </Collapse>
    </>
  )
}

export type PDFFileNode = {
  key: string
  node: React.ReactNode
}

type DownloadableFilesDisplayProps = {
  attachments: Attachment[]
  pdfFileNodes?: PDFFileNode[]
}
function DownloadableFilesDisplay({
  attachments,
  pdfFileNodes,
}: DownloadableFilesDisplayProps) {
  const layout = useLayout()

  const totalToDisplay = React.useMemo(() => {
    return attachments.length + (pdfFileNodes?.length ?? 0)
  }, [attachments, pdfFileNodes])

  return (
    <>
      <div className="ob-downloadable-files__container">
        <Grid
          container
          spacing={2}
          justifyContent={totalToDisplay === 1 ? 'center' : undefined}
        >
          {pdfFileNodes &&
            pdfFileNodes.map(({ node, key }) => (
              <Grid item xs={12} sm={layout === 'GRID' ? 6 : 12} key={key}>
                {node}
              </Grid>
            ))}
          {attachments.map((attachment, index) => (
            <Grid item xs={12} sm={layout === 'GRID' ? 6 : 12} key={index}>
              <SingleFileDisplay attachment={attachment} />
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  )
}

const getFileTypeIcon = (type: string) => {
  // Add other appropriate icons for file types here anytime
  if (type.includes('doc')) {
    return 'description'
  }
  return 'attach_file'
}

export const SingleFileDisplay = ({
  attachment,
  className,
}: {
  attachment: Attachment
  className?: string
}) => {
  const { avatar } = React.useMemo(() => {
    const avatar = () => {
      return attachment.contentType.includes('image') ? (
        <img
          src={attachment.signedUrl}
          alt={attachment.filename}
          className="ob-downloadable-files__thumbnail"
        />
      ) : (
        <MaterialIcon className="ob-downloadable-files__icon">
          {getFileTypeIcon(attachment.contentType)}
        </MaterialIcon>
      )
    }

    return { avatar: avatar() }
  }, [attachment.filename, attachment.contentType, attachment.signedUrl])

  return (
    <Tooltip title={attachment.filename} arrow>
      <a
        href={attachment.signedUrl}
        target="_blank"
        rel="noreferrer"
        download
        className={clsx('ob-downloadable-files__item', className)}
      >
        {avatar}
        <div className="ob-downloadable-files__content">
          <div className="ob-downloadable-files__filename ob-downloadable-files__text">
            {attachment.filename}
          </div>
          <div className="ob-downloadable-files__filetype ob-downloadable-files__text">
            {attachment.contentType.split('/')[1] || 'Unknown'}
          </div>
        </div>
        <MaterialIcon className="ob-downloadable-files__download-icon">
          download
        </MaterialIcon>
      </a>
    </Tooltip>
  )
}

/** Centers the PDF Download button */
export const OnlyPDFDisplay = ({
  children,
  className,
}: {
  children: PDFFileNode[]
  className?: string
}) => {
  const layout = useLayout()

  return (
    <div className={clsx('ob-downloadable-files__container', className)}>
      <Grid
        container
        spacing={2}
        justifyContent={children.length === 1 ? 'center' : undefined}
      >
        {children.map(({ node, key }) => (
          <Grid item xs={12} sm={layout === 'GRID' ? 6 : 12} key={key}>
            {node}
          </Grid>
        ))}
      </Grid>
    </div>
  )
}
