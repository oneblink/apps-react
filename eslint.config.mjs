import { defineConfig, globalIgnores } from 'eslint/config'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import reactHooks from 'eslint-plugin-react-hooks'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import pluginMicrosoftSdl from '@microsoft/eslint-plugin-sdl'

// Values that are structurally shared or cached between renders. Mutating them
// in place leaves memoised components rendering stale data (see AGENTS.md).
const SHARED_VALUE_NAMES =
  '/^(formElementsConditionallyShown|formElementConditionallyShown|conditionallyShownOptionsElement|formElementsValidation|formElementValidation|formSubmissionModel|submission|currentFormSubmission|executedLookups|existingExecutedLookups|sectionState|currentSectionState)$/'
const SHARED_VALUE_MUTATION_MESSAGE =
  'Shared form values must not be mutated in place, create a new object instead (see AGENTS.md).'
// Only the object being written through is checked, so replacing a property on
// another object (e.g. `memo.submission = newSubmission`) is allowed.
const sharedValueMutationRules = [
  `AssignmentExpression > MemberExpression.left > Identifier.object[name=${SHARED_VALUE_NAMES}]`,
  `AssignmentExpression > MemberExpression.left > .object Identifier[name=${SHARED_VALUE_NAMES}]`,
  `UpdateExpression > MemberExpression.argument > Identifier.object[name=${SHARED_VALUE_NAMES}]`,
  `UpdateExpression > MemberExpression.argument > .object Identifier[name=${SHARED_VALUE_NAMES}]`,
  `UnaryExpression[operator="delete"] > MemberExpression.argument > Identifier.object[name=${SHARED_VALUE_NAMES}]`,
  `UnaryExpression[operator="delete"] > MemberExpression.argument > .object Identifier[name=${SHARED_VALUE_NAMES}]`,
  `CallExpression > MemberExpression.callee[property.name=/^(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)$/] > .object Identifier[name=${SHARED_VALUE_NAMES}]`,
  `CallExpression > MemberExpression.callee[property.name=/^(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)$/] > Identifier.object[name=${SHARED_VALUE_NAMES}]`,
  `CallExpression[callee.object.name="Object"][callee.property.name=/^(assign|defineProperty|defineProperties|setPrototypeOf)$/] > .arguments:first-child Identifier[name=${SHARED_VALUE_NAMES}]`,
  `CallExpression[callee.object.name="Object"][callee.property.name=/^(assign|defineProperty|defineProperties|setPrototypeOf)$/] > Identifier.arguments:first-child[name=${SHARED_VALUE_NAMES}]`,
].map((selector) => ({ selector, message: SHARED_VALUE_MUTATION_MESSAGE }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  globalIgnores([
    './node_modules/**',
    './dist/**',
    './docs/**',
    './scripts/**',
  ]),
  pluginMicrosoftSdl.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ),
    ),

    plugins: { '@typescript-eslint': fixupPluginRules(typescriptEslint) },

    languageOptions: {
      globals: { ...globals.browser },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.eslint.json',
      },
    },

    settings: { react: { version: 'detect' } },

    rules: {
      'react/prop-types': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-restricted-syntax': ['error', ...sharedValueMutationRules],
    },
  },
])
