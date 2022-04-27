import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material'

export const CustomAccordion = styled(Accordion)(({ theme }) => ({
  '.MuiAccordion-root': {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    width: '100%',
    '&:not(:last-of-type)': {
      borderBottom: 'none',
    },
    '&:before': {
      display: 'none',
    },
  },
  '.Mui-expanded': {
    margin: 'auto',
  },
}))

export const CustomAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  '.MuiAccordionSummary-root': {
    backgroundColor: 'rgba(0, 0, 0, .03)',
  },
  '.Mui-expanded': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: theme.spacing(6),
  },
  '.MuiAccordionSummary-content': {
    '.Mui-expanded': {
      margin: theme.spacing(1, 0),
    },
  },
}))

export const CustomAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  '.MuiAccordionDetails-root': {
    padding: theme.spacing(1, 2),
  },
}))
