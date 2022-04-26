import * as React from 'react'
import LoadingWithMessage from './components/LoadingWithMessage'
import ErrorMessage from './components/ErrorMessage'
import FormStore from './components/formStore/FormStore'
import { formStoreService } from '@oneblink/apps'
import WarningIcon from '@mui/icons-material/Warning'
import useLoadDataState from './hooks/useLoadDataState'
import { Box, Button, Container, Grid, Typography } from '@mui/material'
import LargeIconMessage from './components/messages/LargeIconMessage'
import { ListItem, UnorderedList } from './components/Lists'
import useLegacyFormElements from './hooks/useLegacyElements'
import { FormTypes } from '@oneblink/types'

interface Props {
  form: FormTypes.Form
}
function FormStoreContainer({ form }: Props) {
  const fetchFormStoreDefinition = React.useCallback(
    (abortSignal?: AbortSignal) => {
      return formStoreService.getFormStoreDefinition(form.id, abortSignal)
    },
    [form.id],
  )
  const [formStoreDefinitionState, onTryAgain] = useLoadDataState(
    fetchFormStoreDefinition,
  )

  const { formElementsUsingLegacyStorage, formElementsUsingLegacyNames } =
    useLegacyFormElements(form?.elements || [])

  if (formStoreDefinitionState.status === 'LOADING') {
    return <LoadingWithMessage />
  }

  if (formStoreDefinitionState.status === 'ERROR') {
    return (
      <>
        <ErrorMessage title="Error Retrieving Form Definition" gutterTop>
          {formStoreDefinitionState.error.message}
        </ErrorMessage>
        <Grid container justifyContent="center">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onTryAgain()}
          >
            Try Again
          </Button>
        </Grid>
      </>
    )
  }

  if (
    formElementsUsingLegacyStorage.length ||
    formElementsUsingLegacyNames.length
  ) {
    return (
      <>
        <LargeIconMessage
          IconComponent={WarningIcon}
          title="Incompatible Form Elements"
          variant="warning"
          gutterTop
          gutterBottom
        >
          This Form has Element(s) that are incompatible with Data Manager. If
          you would like to be able to view submissions for this Form, please
          follow the instructions below to ensure your Form is compatible.
        </LargeIconMessage>
        <Container maxWidth="sm">
          {!!formElementsUsingLegacyStorage.length && (
            <>
              <Typography variant="body2">
                The following Element(s) are using the <b>Embedded</b> storage
                type. Please update them to use either the Private or Public
                storage type.
              </Typography>
              <Box marginBottom={1}>
                <UnorderedList>
                  {formElementsUsingLegacyStorage.map(
                    ({ name, label }, index) => (
                      <ListItem key={index}>
                        <b>{label}</b>{' '}
                        <Typography
                          component="span"
                          variant="body2"
                          color="textSecondary"
                        >
                          {name}
                        </Typography>
                      </ListItem>
                    ),
                  )}
                </UnorderedList>
              </Box>
            </>
          )}
          {!!formElementsUsingLegacyNames.length && (
            <>
              <Typography variant="body2">
                This following Element(s) have a <b>Name</b> property with
                unsupported characters. Please update them to have only letters,
                numbers, underscores and dashes.
              </Typography>
              <UnorderedList>
                {formElementsUsingLegacyNames.map(({ name, label }, index) => (
                  <ListItem key={index}>
                    <b>{label}</b>{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {name}
                    </Typography>
                  </ListItem>
                ))}
              </UnorderedList>
            </>
          )}
        </Container>
      </>
    )
  }

  return (
    <FormStore
      form={form}
      formElements={formStoreDefinitionState.result.formElements}
    />
  )
}

export default React.memo(FormStoreContainer)
