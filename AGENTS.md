# Agent guidelines

## Never mutate form state in place

Form rendering performance depends on object identity: unchanged values are
reused between renders so memoised components (e.g. each repeatable set entry)
can skip rendering. Mutating a shared object in place leaves those components
showing stale data, and the bug is silent.

Always create new objects and arrays (spread, `map`, `filter`, etc.) instead of
assigning properties, `push`/`splice`/`sort` on existing arrays, `delete`, or
`Object.assign` onto an existing object. This applies in particular to:

- the submission, definition, `executedLookups` and `sectionState` held in form
  state, including inside `setFormSubmission`/`onChange`/`onLookup` setters
- conditionally shown results (`formElementsConditionallyShown`)
- validation results (`formElementsValidation`)
- the cleaned model from `useFormSubmissionModel()` and related hooks, which is
  cached and shared between providers

Mutating an object you created yourself in the same function (e.g. a `reduce`
accumulator) is fine.

The `oneblink/no-shared-form-value-mutation` rule
(`eslint-rules/no-shared-form-value-mutation.mjs`, configured in
`eslint.config.mjs`) reports mutations of these values by their usual variable
names. It cannot follow aliases (e.g.
`const entries = submission.entries; entries.push(...)`), so do not rely on it
alone.
