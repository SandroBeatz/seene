// Flat ESLint config (ESLint 9/10). Extends Expo's config and layers on:
//  1. FSD-lite import boundaries (downward-only, no sibling imports)
//  2. "supabase only inside entities/*/api" guard
//  3. "no raw color literals in UI layers" guard
// See docs/mobile-architecture.md §10 and docs/design-system.md §8.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'scripts/*', '*.config.js'],
  },
  // ---- FSD-lite layer boundaries (eslint-plugin-boundaries v7) ----
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/**/*' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'off',
      'boundaries/no-unknown-files': 'off',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Downward-only; within a layer only the SAME slice may be imported
            // (no sibling feature↔feature / entity↔entity / widget↔widget).
            {
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { types: { anyOf: ['app', 'widgets', 'features', 'entities', 'shared'] } } },
              },
            },
            {
              from: { element: { type: 'widgets' } },
              allow: { to: { element: { types: { anyOf: ['features', 'entities', 'shared'] } } } },
            },
            {
              from: { element: { type: 'widgets' } },
              allow: { to: { element: { type: 'widgets', captured: { slice: '{{from.captured.slice}}' } } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { type: 'features', captured: { slice: '{{from.captured.slice}}' } } } },
            },
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'entities', captured: { slice: '{{from.captured.slice}}' } } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },
  // ---- Guard: supabase only inside entities/*/api/** ----
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'Import supabase only inside an entity api file (entities/<x>/api/<x>.api.ts). See docs/api-layer.md §1.',
            },
            {
              name: '@shared/api/supabase',
              message:
                'The supabase client may only be used inside an entity api file. Call query hooks instead.',
            },
            {
              name: '@/shared/api/supabase',
              message:
                'The supabase client may only be used inside an entity api file. Call query hooks instead.',
            },
          ],
          patterns: [
            {
              group: ['**/shared/api/supabase'],
              message:
                'The supabase client may only be used inside an entity api file. Call query hooks instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // the ONLY places allowed to touch supabase directly
    files: ['src/entities/*/api/**/*.ts', 'src/shared/api/supabase.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // ---- Guard: no raw color literals in UI layers (tokens only) ----
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/widgets/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]",
          message:
            'No raw color literals outside shared/theme. Use a semantic theme token. See docs/design-system.md §8.',
        },
      ],
    },
  },
  prettier,
]);
