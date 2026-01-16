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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  globalIgnores([
    '**/build',
    '**/node_modules',
    '**/plugins',
    '**/platforms',
    '**/coverage',
    '**/dist',
    '**/www',
    '**/flow-typed',
    '**/vite.config.ts',
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
        project: './tsconfig.json',
      },
    },

    settings: { react: { version: 'detect' } },

    rules: {
      'react/prop-types': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
])
