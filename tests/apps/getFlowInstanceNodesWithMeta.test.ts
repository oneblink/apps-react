import { describe, expect, it } from 'vitest'
import { ApprovalTypes } from '@oneblink/types'
import { getFlowInstanceNodesWithMeta } from '../../src/services/getFlowInstanceNodesWithMeta'

const createFlowInstance = (
  steps: ApprovalTypes.FormApprovalFlowInstanceStep[],
): ApprovalTypes.FormApprovalFlowInstance => ({
  id: 1,
  formId: 1,
  submissionId: 'submission',
  approvalsFormsAppId: 1,
  steps,
  isLatest: true,
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const createNode = (
  label: string,
): ApprovalTypes.FormApprovalFlowInstanceNode => ({
  label,
  group: 'approvers',
  isSkipped: false,
})

const createApproval = ({
  id,
  stepLabel,
  status,
  updatedAt,
}: {
  id: string
  stepLabel: string
  status: ApprovalTypes.FormSubmissionApproval['status']
  updatedAt: string
}): ApprovalTypes.FormSubmissionApproval => ({
  id,
  formApprovalFlowInstanceId: 1,
  group: 'approvers',
  stepLabel,
  status,
  createdAt: updatedAt,
  updatedAt,
})

describe('getFlowInstanceNodesWithMeta', () => {
  it('orders concurrent nodes as actioned, currently viewing, then unactioned', () => {
    const formApprovalFlowInstance = createFlowInstance([
      {
        type: 'CONCURRENT',
        nodes: [
          createNode('Finance'),
          createNode('Manager'),
          createNode('Payroll'),
        ],
      },
    ])
    const formSubmissionApprovals = [
      createApproval({
        id: 'finance',
        stepLabel: 'Finance',
        status: 'PENDING',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      createApproval({
        id: 'manager',
        stepLabel: 'Manager',
        status: 'PENDING',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      createApproval({
        id: 'payroll',
        stepLabel: 'Payroll',
        status: 'APPROVED',
        updatedAt: '2026-01-01T11:00:00.000Z',
      }),
    ]

    expect(
      getFlowInstanceNodesWithMeta(
        formApprovalFlowInstance,
        formSubmissionApprovals,
        'manager',
      ).map(({ label, isConcurrentWithPrevious, isConcurrentWithNext }) => ({
        label,
        isConcurrentWithPrevious,
        isConcurrentWithNext,
      })),
    ).toEqual([
      {
        label: 'Payroll',
        isConcurrentWithPrevious: false,
        isConcurrentWithNext: true,
      },
      {
        label: 'Manager',
        isConcurrentWithPrevious: true,
        isConcurrentWithNext: true,
      },
      {
        label: 'Finance',
        isConcurrentWithPrevious: true,
        isConcurrentWithNext: false,
      },
    ])
  })

  it('orders actioned concurrent nodes by the time they were actioned', () => {
    const formApprovalFlowInstance = createFlowInstance([
      {
        type: 'CONCURRENT',
        nodes: [createNode('First'), createNode('Second'), createNode('Third')],
      },
    ])
    const formSubmissionApprovals = [
      createApproval({
        id: 'first',
        stepLabel: 'First',
        status: 'APPROVED',
        updatedAt: '2026-01-01T12:00:00.000Z',
      }),
      createApproval({
        id: 'second',
        stepLabel: 'Second',
        status: 'CLOSED',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      createApproval({
        id: 'third',
        stepLabel: 'Third',
        status: 'CLARIFICATION_REQUIRED',
        updatedAt: '2026-01-01T11:00:00.000Z',
      }),
    ]

    expect(
      getFlowInstanceNodesWithMeta(
        formApprovalFlowInstance,
        formSubmissionApprovals,
      ).map(({ label }) => label),
    ).toEqual(['Second', 'Third', 'First'])
  })

  it('orders a later concurrent step first when it was actioned first', () => {
    const formApprovalFlowInstance = createFlowInstance([
      {
        type: 'CONCURRENT',
        nodes: [createNode('Approve 2a'), createNode('Approve 2b')],
      },
    ])
    const formSubmissionApprovals = [
      createApproval({
        id: '2a',
        stepLabel: 'Approve 2a',
        status: 'PENDING',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      createApproval({
        id: '2b',
        stepLabel: 'Approve 2b',
        status: 'APPROVED',
        updatedAt: '2026-01-01T11:00:00.000Z',
      }),
    ]

    expect(
      getFlowInstanceNodesWithMeta(
        formApprovalFlowInstance,
        formSubmissionApprovals,
      ).map(({ label }) => label),
    ).toEqual(['Approve 2b', 'Approve 2a'])
  })

  it('does not reorder sequential steps around a concurrent group', () => {
    const formApprovalFlowInstance = createFlowInstance([
      {
        type: 'STANDARD',
        ...createNode('Team lead'),
      },
      {
        type: 'CONCURRENT',
        nodes: [createNode('Finance'), createNode('Payroll')],
      },
      {
        type: 'STANDARD',
        ...createNode('Director'),
      },
    ])
    const formSubmissionApprovals = [
      createApproval({
        id: 'team-lead',
        stepLabel: 'Team lead',
        status: 'APPROVED',
        updatedAt: '2026-01-01T09:00:00.000Z',
      }),
      createApproval({
        id: 'payroll',
        stepLabel: 'Payroll',
        status: 'APPROVED',
        updatedAt: '2026-01-01T11:00:00.000Z',
      }),
      createApproval({
        id: 'finance',
        stepLabel: 'Finance',
        status: 'PENDING',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
    ]

    expect(
      getFlowInstanceNodesWithMeta(
        formApprovalFlowInstance,
        formSubmissionApprovals,
        'finance',
      ).map(({ label }) => label),
    ).toEqual(['Team lead', 'Payroll', 'Finance', 'Director'])
  })
})
