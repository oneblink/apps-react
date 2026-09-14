import { ApprovalTypes, FormTypes } from '@oneblink/types'
import { expandEditableFormElementIds } from '../../utils/read-only-form-elements'

export default function getApproverEditableFormElementIds(
  approvalSteps: ApprovalTypes.FormApprovalFlowStep[] | undefined,
  formElements: FormTypes.FormElement[] = [],
): string[] {
  const editableFormElementIds = new Set<string>()

  for (const step of approvalSteps ?? []) {
    const nodes = step.type === 'CONCURRENT' ? step.nodes : [step]
    for (const node of nodes) {
      for (const formElementId of node.editableFormElementIds ?? []) {
        editableFormElementIds.add(formElementId)
      }
    }
  }

  return (
    expandEditableFormElementIds([...editableFormElementIds], formElements) ??
    []
  )
}
