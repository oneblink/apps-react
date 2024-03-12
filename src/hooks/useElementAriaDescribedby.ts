import { FormTypes } from '@oneblink/types'

const useElementAriaDescribedby = (
  id: string,
  element: FormTypes.FormElement,
) => {
  return 'hintPosition' in element &&
    element.hintPosition === 'BELOW_LABEL' &&
    !!element.hint
    ? `${id}-hint`
    : undefined
}

export default useElementAriaDescribedby
