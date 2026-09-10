import { ApprovalTypes } from '@oneblink/types'

const possibleStatuses = [
  {
    label: 'Awaiting Approval',
    value: 'PENDING',
  },
  {
    label: 'Approved',
    value: 'APPROVED',
  },
  {
    label: 'Clarification Requested',
    value: 'CLARIFICATION_REQUIRED',
  },
  {
    label: 'Clarification Received',
    value: 'CLARIFICATION_RECEIVED',
  },
  {
    label: 'Denied',
    value: 'CLOSED',
  },
]

const ACTIONED_STATUSES: ReadonlySet<
  ApprovalTypes.FormSubmissionApproval['status']
> = new Set(['APPROVED', 'CLOSED', 'CLARIFICATION_REQUIRED'])

function findLatestFormSubmissionApproval(
  flowInstanceNode: { label: string },
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[],
) {
  return formSubmissionApprovals.reduce<
    ApprovalTypes.FormSubmissionApproval | undefined
  >((lastUpdatedFormSubmissionApproval, formSubmissionApproval) => {
    if (
      formSubmissionApproval.stepLabel === flowInstanceNode.label &&
      (!lastUpdatedFormSubmissionApproval ||
        lastUpdatedFormSubmissionApproval.updatedAt <
          formSubmissionApproval.updatedAt)
    ) {
      return formSubmissionApproval
    }
    return lastUpdatedFormSubmissionApproval
  }, undefined)
}

function getConcurrentSortRank(
  node: ApprovalTypes.FlowInstanceNodeWithMeta,
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[],
  currentlyViewingFormSubmissionApprovalId: string | undefined,
) {
  const approval = findLatestFormSubmissionApproval(
    node,
    formSubmissionApprovals,
  )
  if (approval && ACTIONED_STATUSES.has(approval.status)) {
    return 0
  }
  if (
    currentlyViewingFormSubmissionApprovalId &&
    approval?.id === currentlyViewingFormSubmissionApprovalId
  ) {
    return 1
  }
  return 2
}

function withUpdatedConcurrentFlags(
  nodes: ApprovalTypes.FlowInstanceNodeWithMeta[],
) {
  return nodes.map((node, index) => ({
    ...node,
    isConcurrentWithPrevious: index !== 0,
    isConcurrentWithNext: index < nodes.length - 1,
  }))
}

function sortConcurrentGroup(
  nodes: ApprovalTypes.FlowInstanceNodeWithMeta[],
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[],
  currentlyViewingFormSubmissionApprovalId: string | undefined,
) {
  const sorted = [...nodes].sort((left, right) => {
    const leftRank = getConcurrentSortRank(
      left,
      formSubmissionApprovals,
      currentlyViewingFormSubmissionApprovalId,
    )
    const rightRank = getConcurrentSortRank(
      right,
      formSubmissionApprovals,
      currentlyViewingFormSubmissionApprovalId,
    )
    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }
    if (leftRank === 0) {
      const leftUpdatedAt =
        findLatestFormSubmissionApproval(left, formSubmissionApprovals)
          ?.updatedAt ?? ''
      const rightUpdatedAt =
        findLatestFormSubmissionApproval(right, formSubmissionApprovals)
          ?.updatedAt ?? ''
      return leftUpdatedAt.localeCompare(rightUpdatedAt)
    }
    return 0
  })
  return withUpdatedConcurrentFlags(sorted)
}

function sortConcurrentFlowInstanceNodes(
  nodes: ApprovalTypes.FlowInstanceNodeWithMeta[],
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[],
  currentlyViewingFormSubmissionApprovalId: string | undefined,
) {
  const groups: ApprovalTypes.FlowInstanceNodeWithMeta[][] = []
  for (const node of nodes) {
    const currentGroup = groups[groups.length - 1]
    if (
      currentGroup &&
      currentGroup[0].parentStepLabelsId === node.parentStepLabelsId
    ) {
      currentGroup.push(node)
    } else {
      groups.push([node])
    }
  }

  return groups.flatMap((group) => {
    if (group.length < 2) {
      return group
    }
    return sortConcurrentGroup(
      group,
      formSubmissionApprovals,
      currentlyViewingFormSubmissionApprovalId,
    )
  })
}

function getFormApprovalFlowInstanceNodes(
  steps: ApprovalTypes.FormApprovalFlowInstanceStep[],
) {
  return steps.reduce<
    Array<
      ApprovalTypes.FormApprovalFlowInstanceNode &
        Pick<
          ApprovalTypes.FlowInstanceNodeMeta,
          | 'parentStepLabelsId'
          | 'isConcurrentWithPrevious'
          | 'isConcurrentWithNext'
        >
    >
  >((memo, step) => {
    switch (step.type) {
      case 'CONCURRENT': {
        const parentStepLabelsId = step.nodes
          .map(({ label }) => label)
          .join('_')
        for (const node of step.nodes) {
          const index = step.nodes.indexOf(node)
          memo.push({
            ...node,
            parentStepLabelsId,
            isConcurrentWithPrevious: index !== 0,
            isConcurrentWithNext: index < step.nodes.length - 1,
          })
        }
        break
      }
      case 'STANDARD':
      default: {
        memo.push({
          ...step,
          isConcurrentWithPrevious: false,
          isConcurrentWithNext: false,
          parentStepLabelsId: step.label,
        })
        break
      }
    }
    return memo
  }, [])
}

/**
 * Inputs a form approval flow instance and set of form submission approvals and
 * returns a flattened array of nodes/steps with inlcuded metadata.
 *
 * #### Example
 *
 * ```js
 * const formApprovalFlowInstance = {
 *   steps: [
 *     {
 *       type: 'STANDARD',
 *       group: 'oneblink:administrator',
 *       isSkipped: false,
 *       label: 'Manager Approval',
 *       approvalFormId: '1234',
 *     },
 *     {
 *       type: 'CONCURRENT',
 *       nodes: [
 *         {
 *           label: 'HR Review',
 *           group: 'oneblink:administrator',
 *           isSkipped: false,
 *           approvalFormId: '1234',
 *         },
 *         {
 *           label: 'Finance Review',
 *           group: 'oneblink:administrator',
 *           isSkipped: false,
 *           approvalFormId: '1234',
 *         },
 *       ],
 *     },
 *   ],
 * }
 *
 * const formSubmissionApprovals = [
 *   {
 *     id: 'approval1',
 *     stepLabel: 'Manager Approval',
 *     status: 'APPROVED',
 *     createdAt: '2024-03-20T10:00:00Z',
 *     updatedAt: '2024-03-20T10:00:00Z',
 *     updatedBy: 'fake@fake.com',
 *     group: 'oneblink:administrator',
 *     approvalFormId: '1234',
 *   },
 * ]
 *
 * const nodesWithMeta = getFlowInstanceNodesWithMeta(
 *   formApprovalFlowInstance,
 *   formSubmissionApprovals,
 * )
 * ```
 *
 * Concurrent nodes are ordered as actioned (by the time they were actioned),
 * then the currently viewed pending approval if
 * `currentlyViewingFormSubmissionApprovalId` is provided, then remaining
 * unactioned nodes in definition order. Sequential steps around a concurrent
 * group are not reordered.
 *
 * @param formApprovalFlowInstance
 * @param formSubmissionApprovals
 * @param currentlyViewingFormSubmissionApprovalId The id of the approval
 *   currently being viewed, used to keep that pending concurrent step next to
 *   already actioned siblings.
 * @returns ApprovalTypes.FlowInstanceNodeWithMeta[]
 */
export function getFlowInstanceNodesWithMeta(
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance,
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[],
  currentlyViewingFormSubmissionApprovalId?: string,
): ApprovalTypes.FlowInstanceNodeWithMeta[] {
  const formApprovalFlowInstanceNodes = getFormApprovalFlowInstanceNodes(
    formApprovalFlowInstance.steps,
  )
  let isDenied = false
  let isClarificationRequired = false
  const nodesWithMeta = formApprovalFlowInstanceNodes.map((step) => {
    const associatedApproval = findLatestFormSubmissionApproval(
      step,
      formSubmissionApprovals,
    )
    const status = possibleStatuses.find(
      ({ value }) => value === associatedApproval?.status,
    )

    let isDeniedInConcurrentStep = false
    let isClarificationRequiredInConcurrentStep = false
    if (status?.value === 'PENDING') {
      const siblingNodes = formApprovalFlowInstanceNodes.filter(
        ({ parentStepLabelsId, label }) =>
          parentStepLabelsId === step.parentStepLabelsId &&
          label !== step.label,
      )
      for (const siblingNode of siblingNodes) {
        const formSubmissionApproval = findLatestFormSubmissionApproval(
          siblingNode,
          formSubmissionApprovals,
        )
        if (formSubmissionApproval?.status === 'CLOSED') {
          isDeniedInConcurrentStep = true
        }
        if (formSubmissionApproval?.status === 'CLARIFICATION_REQUIRED') {
          isClarificationRequiredInConcurrentStep = true
        }
      }
    }

    const isAfterDeniedStep = isDenied
    if (status?.value === 'CLOSED') {
      isDenied = true
    }

    const isAfterClarificationRequiredStep = isClarificationRequired
    if (status?.value === 'CLARIFICATION_REQUIRED') {
      isClarificationRequired = true
    }

    let description = 'Awaiting previous approvals'
    if (step.isSkipped) {
      description = 'Skipped based on form submission'
    } else if (status) {
      const updatedByText = associatedApproval?.updatedBy
        ? ` by ${associatedApproval.updatedBy}`
        : ''
      description = `${status.label}${updatedByText}`
    } else if (isAfterDeniedStep) {
      description = 'Denied in a previous step'
    } else if (isAfterClarificationRequiredStep) {
      description = 'Sent for clarification in a previous step'
    }

    return {
      ...step,
      status,
      isDeniedInConcurrentStep,
      isAfterDeniedStep,
      isClarificationRequiredInConcurrentStep,
      isAfterClarificationRequiredStep,
      description,
    }
  })

  return sortConcurrentFlowInstanceNodes(
    nodesWithMeta,
    formSubmissionApprovals,
    currentlyViewingFormSubmissionApprovalId,
  )
}
