import { ApprovalTypes } from '@oneblink/types'

export default function getApproverEditableFormElementIds(
  approvalSteps: ApprovalTypes.FormApprovalFlowStep[] | undefined,
): string[] {
  const editableFormElementIds = new Set<string>()

  for (const step of approvalSteps ?? []) {
    if (step.type === 'PAYMENT') {
      continue
    }
    const nodes = step.type === 'CONCURRENT' ? step.nodes : [step]
    for (const node of nodes) {
      for (const formElementId of node.editableFormElementIds ?? []) {
        editableFormElementIds.add(formElementId)
      }
    }
  }

  return [...editableFormElementIds]
}
