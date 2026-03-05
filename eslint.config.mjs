import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,

  // Official Airbnb configs (legacy -> via FlatCompat)
  ...compat.extends('airbnb-base', 'airbnb-typescript/base', 'prettier'),

  {
    rules: {
      'import/prefer-default-export': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      'arrow-body-style': 'off',
      'no-useless-return': 'off',
      'class-methods-use-this': 'off',
    },
  },

  // TS project-aware linting
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
  },

  {
    ignores: [
      'lib/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'eslint.config.*',
      'eslint.d.ts',
      'jest.config.js',
    ],
  },
];
