import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import nodePlugin from 'eslint-plugin-node';
import prettierPlugin from 'eslint-plugin-prettier';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      jsdoc: jsdocPlugin,
      node: nodePlugin,
      prettier: prettierPlugin,
      promise: promisePlugin,
      security: securityPlugin,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin
    },
    rules: {
      // ======================================================================
      // TypeScript Rules
      // ======================================================================
      ...tsPlugin.configs['recommended'].rules,
      ...tsPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'class',
          format: ['PascalCase']
        }
      ],

      // ======================================================================
      // Import Rules
      // ======================================================================
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      // ======================================================================
      // JSDoc Rules
      // ======================================================================
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'off', // TypeScript handles this
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',

      // ======================================================================
      // Node.js Rules
      // ======================================================================
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-missing-import': 'off',
      'node/no-unpublished-import': 'off',

      // ======================================================================
      // Promise Rules
      // ======================================================================
      'promise/always-return': 'off',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'warn',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'off',

      // ======================================================================
      // Security Rules
      // ======================================================================
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'off', // Too many false positives
      'security/detect-non-literal-fs-filename': 'off',

      // ======================================================================
      // SonarJS Rules (Code Quality)
      // ======================================================================
      'sonarjs/cognitive-complexity': ['warn', 20],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-collection-size-mischeck': 'error',
      'sonarjs/no-duplicated-branches': 'warn',
      'sonarjs/no-element-overwrite': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-same-line-conditional': 'error',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',

      // ======================================================================
      // Unicorn Rules (Best Practices)
      // ======================================================================
      'unicorn/better-regex': 'warn',
      'unicorn/catch-error-name': 'warn',
      'unicorn/consistent-destructuring': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'warn',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/explicit-length-check': 'warn',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['^[A-Z].*\\.ts$'] // Allow PascalCase for class files
        }
      ],
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-abusive-eslint-disable': 'warn',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-null': 'off', // We use null in APIs
      'unicorn/no-useless-undefined': 'off',
      'unicorn/number-literal-case': 'warn',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/prefer-add-event-listener': 'warn',
      'unicorn/prefer-array-find': 'warn',
      'unicorn/prefer-array-flat-map': 'warn',
      'unicorn/prefer-array-some': 'warn',
      'unicorn/prefer-date-now': 'warn',
      'unicorn/prefer-default-parameters': 'warn',
      'unicorn/prefer-includes': 'warn',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-number-properties': 'warn',
      'unicorn/prefer-optional-catch-binding': 'warn',
      'unicorn/prefer-spread': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/prefer-switch': 'warn',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-type-error': 'warn',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/throw-new-error': 'error',

      // ======================================================================
      // General Best Practices
      // ======================================================================
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': 'warn',
      'no-lonely-if': 'warn',
      'no-useless-concat': 'warn',
      'object-shorthand': 'warn',
      'prefer-destructuring': 'off',
      'prefer-spread': 'warn',
      'prefer-rest-params': 'warn',
      'no-param-reassign': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // ======================================================================
      // Prettier Integration
      // ======================================================================
      'prettier/prettier': 'error'
    }
  },

  // Configuration for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off'
    }
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '*.d.ts',
      'native/**/*.cpp',
      'native/**/*.h',
      '.cursor/**'
    ]
  },

  // Prettier config to disable conflicting rules
  prettierConfig
];
