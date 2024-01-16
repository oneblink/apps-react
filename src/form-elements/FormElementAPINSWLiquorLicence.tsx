import * as React from 'react'
import { FormTypes, APINSWTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import AutocompleteDropdown, {
  AutocompleteOption,
} from '../components/renderer/AutocompleteDropdown'
import useIsMounted from '../hooks/useIsMounted'

type Props = {
  id: string
  element: FormTypes.APINSWLiquorLicenceElement
  value: APINSWTypes.LiquorLicenceDetails | undefined
  onChange: FormElementValueChangeHandler<APINSWTypes.LiquorLicenceDetails>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

const mockLicences: AutocompleteOption<APINSWTypes.LiquorLicenceDetails>[] = [
  {
    label: 'Licence 1',
    value: 'licencenumber1',
    data: {
      licenceDetail: {
        licenceNumber: 'licencenumber1',
      },
    },
  },
  {
    label: 'Licence 2',
    value: 'licencenumber2',
    data: {
      licenceDetail: {
        licenceNumber: 'licencenumber2',
      },
    },
  },
]
const browseLiquorLicences = async () => {
  return mockLicences
}

const fetchSingleLiquorLicence = async (licenceNumber: string) => {
  const licence = mockLicences.find((l) => l.value === licenceNumber)
  return licence
}

function FormElementAPINSWLiquorLicence({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  console.log('Liquor Element')
  const isMounted = useIsMounted()
  // const abnLookupAuthenticationGuid = useAbnLookupAuthenticationGuid()
  const [label, setLabel] = React.useState('')
  // const [isFocused, setIsFocused, removeFocus] = useBooleanState(false)
  const [{ isLoading, error }, setState] = React.useState<{
    isLoading: boolean
    error: Error | null
  }>({
    isLoading: false,
    error: null,
  })

  const handleSearch = React.useCallback(async () =>
    // TODO - Use these
    //v: string,
    //abortSignal: AbortSignal
    {
      setState((current) => ({
        ...current,
        error: null,
      }))

      return browseLiquorLicences()
    }, [])

  const fetchAndSelectSingleLicence = React.useCallback(
    async (newValue: string | undefined) => {
      console.log(`Selected: ${newValue}`)
      if (!newValue) {
        onChange(element, { value: undefined })
        return
      }
      setState((current) => ({
        ...current,
        isLoading: true,
      }))

      try {
        // TODO - Real Fetch
        const result = await fetchSingleLiquorLicence(newValue)
        if (result) {
          onChange(element, { value: result.data })
        }
        if (isMounted.current) {
          setState({
            isLoading: false,
            error: null,
          })
        }
      } catch (newError) {
        if (isMounted.current) {
          setState({
            isLoading: false,
            error: newError as Error,
          })
        }
      }
    },
    [element, isMounted, onChange],
  )

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      error) &&
    !isLookingUp

  return (
    <div className="cypress-api-nsw-liquor-licence-element">
      <FormElementLabelContainer
        className="ob-api-nsw-liquor-licence ob-autocomplete"
        id={id}
        element={element}
        required={element.required}
      >
        <AutocompleteDropdown
          id={id}
          label={label}
          disabled={element.readOnly || isLoading}
          placeholder={element.placeholderValue}
          required={element.required}
          value={value}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          onChangeValue={fetchAndSelectSingleLicence}
          isLoading={isLoading}
          hasError={!!error}
          onChangeLabel={setLabel}
          searchDebounceMs={750}
          searchMinCharacters={4}
          onSearch={handleSearch}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />

        {value && (
          <div className="control ob-api-nsw-liquor-licence__record-control">
            <div className="button is-static ob-api-nsw-liquor-licence__record-display">
              TODO: Display Card
            </div>
          </div>
        )}
        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {error?.message || validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementAPINSWLiquorLicence)
