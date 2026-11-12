import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/.claude/**',
      '**/dist/**',
      'apps/client/android/**',
      'apps/client/ios/**',
      '**/lib/**',
      '**/node_modules/**',
      '**/coverage/**',
      'public/**',
      'apps/client/public/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Identifier[name='onSnapshot']",
          message:
            'Real-time Firestore listeners (onSnapshot) are forbidden by the architecture plan. Use one-time reads only.'
        }
      ]
    }
  },
  {
    files: ['apps/client/src/**/*.{ts,tsx}'],
    ignores: ['apps/client/src/lib/firebase/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^firebase(/.*)?$',
              message:
                'Firebase SDK imports are isolated to apps/client/src/lib/firebase only (Task 2.8).'
            }
          ]
        }
      ]
    }
  }
);
