import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'

import withStyles from '@mui/styles/withStyles'

export const CustomAccordion = withStyles((theme) => ({
  root: {
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
  },
  expanded: {},
}))(Accordion)

export const CustomAccordionSummary = withStyles((theme) => ({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    '&$expanded': {
      borderBottom: `1px solid ${theme.palette.divider}`,
      minHeight: theme.spacing(6),
    },
  },
  content: {
    '&$expanded': {
      margin: theme.spacing(1, 0),
    },
  },
  expanded: {},
}))(AccordionSummary)

export const CustomAccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(1, 2),
  },
}))(AccordionDetails)
