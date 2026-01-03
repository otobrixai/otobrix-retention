import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  // Base JavaScript rules for all JS files
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // TypeScript rules with more permissive any settings
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Allow 'any' in specific files where necessary
      '@typescript-eslint/no-explicit-any': ['warn', {
        'fixToUnknown': false,
        'ignoreRestArgs': true
      }],
    },
  },

  // Special rules for test files (allow any)
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Special rules for instrumentation and middleware (allow any for security patches)
  {
    files: ['**/instrumentation.ts', '**/middleware/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Next.js specific ignores
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'out/**',
      'public/**',
      'next-env.d.ts',
      'validate-changes.*',
      'verify-all.js',
      'scripts/test-*.ts',
      'scripts/smoke/**',
    ],
  },
]