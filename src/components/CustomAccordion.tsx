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
  '& .Mui-expanded': {
    margin: 'auto',
  },
}))

export const CustomAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  '&.Mui-expanded': {
    minHeight: theme.spacing(6),
  },
  '& .Mui-expanded': {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  '& .MuiAccordionSummary-content': {
    '.Mui-expanded': {
      margin: theme.spacing(1, 0),
    },
  },
}))

export const CustomAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
}))
