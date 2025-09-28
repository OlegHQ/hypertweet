import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

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
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Core TypeScript rules - ESSENTIAL TYPE SAFETY ONLY
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any in special cases
      '@typescript-eslint/no-non-null-assertion': 'warn', // Reduced to warning
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Prefer but don't force
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'off', // AI-friendly: async event handlers
      '@typescript-eslint/require-await': 'warn', // Reduced to warning
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-module-boundary-types': 'off', // AI-friendly: infer return types
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // AI-friendly: allow unused vars
      '@typescript-eslint/prefer-readonly': 'off', // AI-friendly: don't force readonly
      '@typescript-eslint/explicit-function-return-type': 'off', // AI-friendly: infer types

      // General rules - AI-friendly adjustments
      'no-console': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-undef': 'off', // TypeScript handles this better
      'no-useless-return': 'off',
      'no-useless-concat': 'off',
      
      // Complexity rules - AI-friendly limits
      complexity: 'off', // Disabled - AI generates complex functions naturally
      'max-depth': 'off',
      'max-params': 'off',
      'no-magic-numbers': 'off',

      // Security - keep strict
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Style rules - minimal, AI-friendly
      'object-shorthand': 'off',
      'prefer-template': 'off',
      'prefer-arrow-callback': 'off',
      'arrow-body-style': 'off',
      'prefer-destructuring': 'off',
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
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '../server/', '*.min.js', 'coverage/'],
  },
];