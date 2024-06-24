import jsEslint from '@eslint/js';
import eslintPluginPlugin from 'eslint-plugin-eslint-plugin';
import * as importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    plugins: {
      ['simple-import-sort']: simpleImportSortPlugin,
      ['@typescript-eslint']: tsEslint.plugin,
      ['import']: importPlugin,
      ['eslint-plugin']: eslintPluginPlugin,
    },
  },
  {
    ignores: ['./node_modules/**', './build/**','./**/migrations/**/*.ts'],
  },
  jsEslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  ...tsEslint.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      'no-control-regex': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^@?\\w'],
            [
              '^(components|assets|pages|store|ui|entities|widgets)(/.*|$)',
              '^#?\\w',
            ],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          ],
        },
      ],'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tsEslint.configs.disableTypeChecked],
  },
);