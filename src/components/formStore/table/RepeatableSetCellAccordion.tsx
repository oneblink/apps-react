import * as React from 'react'
import {
  CustomAccordion,
  CustomAccordionSummary,
  CustomAccordionDetails,
} from '../../CustomAccordion'
import { Typography } from '@mui/material'
import MaterialIcon from '../../MaterialIcon'

type Props = {
  isOpen: boolean
  onChange: () => void
  title: string
  children: React.ReactNode
}

const RepeatableSetCell = ({ isOpen, onChange, title, children }: Props) => {
  return (
    <CustomAccordion
      expanded={isOpen}
      onChange={onChange}
      data-cypress="form-store-repeatable-set-cell-accordion"
    >
      <CustomAccordionSummary
        expandIcon={<MaterialIcon>expand_more</MaterialIcon>}
        data-cypress="form-store-repeatable-set-cell-accordion-summary"
      >
        <Typography>{title}</Typography>
      </CustomAccordionSummary>
      <CustomAccordionDetails>{children}</CustomAccordionDetails>
    </CustomAccordion>
  )
}

export default React.memo<Props>(RepeatableSetCell)
