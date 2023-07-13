import * as React from 'react'

import FormElementOptions from '../components/renderer/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import ToggleAllCheckbox from '../components/renderer/ToggleAllCheckbox'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  IsDirtyProps,
  UpdateFormElementsHandler,
} from '../types/form'

type Props = {
  id: string
  element: FormTypes.SelectElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string | string[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
  onUpdateFormElements: UpdateFormElementsHandler
} & IsDirtyProps

function FormElementSelect({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  conditionallyShownOptionsElement,
  onUpdateFormElements,
  isDirty,
  setIsDirty,
}: Props) {
  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    conditionallyShownOptionsElement,
    onUpdateFormElements,
  })

  const selectedValuesAsArray = React.useMemo(() => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return [value]
    return []
  }, [value])

  return (
    <div className="cypress-select-element">
      <FormElementLabelContainer
        className="ob-select"
        id={id}
        element={element}
        required={element.required}
      >
        <FormElementOptions
          options={element.options}
          conditionallyShownOptionsElement={conditionallyShownOptionsElement}
        >
          {element.multi && element.canToggleAll && (
            <ToggleAllCheckbox
              id={id}
              element={element}
              options={filteredOptions}
              selected={selectedValuesAsArray}
              disabled={element.readOnly}
              onChange={onChange as FormElementValueChangeHandler<string[]>}
            />
          )}
          {!element.multi ? (
            <div className="field has-addons">
              <div className="control is-expanded">
                <div className="select is-fullwidth">
                  <select
                    id={id}
                    name={element.name}
                    className="cypress-select-single-control ob-input ob-select__single"
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) =>
                      onChange(element, e.target.value || undefined)
                    }
                    required={element.required}
                    disabled={element.readOnly}
                    onBlur={setIsDirty}
                  >
                    <option value="">Please choose</option>
                    {filteredOptions.map(({ label, value }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="select is-multiple control">
              <select
                multiple
                id={id}
                name={element.name}
                className="cypress-select-multiple-control ob-input ob-select__multi"
                value={Array.isArray(value) ? value : []}
                onChange={(e) => {
                  const vals = []
                  for (let i = 0; i < e.target.selectedOptions.length; i++) {
                    vals.push(e.target.selectedOptions[i].value)
                  }
                  onChange(element, vals.length ? vals : undefined)
                }}
                required={element.required}
                disabled={element.readOnly}
                onBlur={setIsDirty}
              >
                {filteredOptions.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <LookupButton
                hasMarginTop
                value={value}
                validationMessage={validationMessage}
                lookupButtonConfig={element.lookupButton}
              />
            </div>
          )}

          {(isDirty || displayValidationMessage) && !!validationMessage && (
            <div role="alert" className="has-margin-top-8">
              <div className="has-text-danger ob-error__text cypress-validation-message">
                {validationMessage}
              </div>
            </div>
          )}
        </FormElementOptions>
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementSelect)
