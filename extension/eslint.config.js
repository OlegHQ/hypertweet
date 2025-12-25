import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        chrome: 'readonly',
        browser: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // TypeScript essentials
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // Turn off overly strict rules
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',

      // General
      'no-console': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead

      // Turn off annoying ones
      'no-unused-expressions': 'off',
      'object-shorthand': 'off',
      'prefer-template': 'off',
      'prefer-arrow-callback': 'off',
      'arrow-body-style': 'off',
      'no-useless-return': 'off',
      'no-useless-concat': 'off',
      'prefer-destructuring': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off',
      'no-magic-numbers': 'off',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['build.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['*.raw.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        MutationObserver: 'readonly',
        InputEvent: 'readonly',
        Promise: 'readonly',
        Array: 'readonly',
        Date: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '../server/', '*.min.js', 'coverage/'],
  },
  prettier,
];
