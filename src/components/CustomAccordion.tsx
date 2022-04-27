import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material'

export const CustomAccordion = styled(Accordion)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  width: '100%',
  '&:not(:last-of-type)': {
    borderBottom: 'none',
  },
  '&:before': {
    display: 'none',
  },
  '&$expanded': {
    margin: 'auto',
  },
}))

export const CustomAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  '&$expanded': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: theme.spacing(6),
  },
}))

export const CustomAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(1, 2),
}))
