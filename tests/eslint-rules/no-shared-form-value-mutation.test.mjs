import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import rule from '../../eslint-rules/no-shared-form-value-mutation.mjs'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser },
})
const options = [{ names: ['submission', 'formSubmissionModel'] }]
const invalid = (code, name = 'submission') => ({
  code,
  options,
  errors: [{ messageId: 'mutation', data: { name } }],
})

ruleTester.run('no-shared-form-value-mutation', rule, {
  valid: [
    'const copy = { ...submission, a: 1 }',
    'const entries = [...submission.entries]; entries.push(1)',
    'copy.b = submission.b',
    'submission.entries.slice().map((entry) => entry)',
    'Object.assign({}, submission)',
    'submission = { ...submission }',
    'memo.submission = submission',
    'memo[submission.name] = 1',
    'memo[submission.name].value = 1',
    'delete memo.submission',
    'getSubmission().a = 1',
    'submissions.push(1)',
  ].map((code) => ({ code, options })),
  invalid: [
    invalid('submission.a = 1'),
    invalid('submission.entries[0].a = 1'),
    invalid("submission['a'] += 1"),
    invalid('submission.count++'),
    invalid('delete submission.a'),
    invalid('submission.entries.push(1)'),
    invalid('submission.entries?.push(1)'),
    invalid('submission.entries.sort()'),
    invalid('Object.assign(submission, {})'),
    invalid('Object.assign(submission.nested, {})'),
    invalid('parent.formSubmissionModel.a = 1', 'formSubmissionModel'),
    invalid('memo.submission.a = 1'),
    invalid('submission!.a = 1'),
    invalid('(submission as Record<string, unknown>).a = 1'),
  ],
})
