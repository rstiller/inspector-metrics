import tseslint from 'typescript-eslint'
import globals from 'globals'

// Faithful port of the legacy `.eslintrc.js` to ESLint 9 flat config.
// The legacy config attached the @typescript-eslint parser + plugin but had
// `extends: []` (no rules enabled), and `lint` effectively parsed each file
// with all @typescript-eslint rules *known* (so inline disable directives
// resolved) but none *active*.
//
// `tseslint.configs.base` reproduces that: it registers the plugin (so rule
// names referenced in comments are valid) without enabling any rules. Enabling
// a recommended rule set is deliberately left out to avoid churning the legacy
// code base; that is a separate follow-up.
export default tseslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    },
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/coverage/**',
      'docs/**',
      '**/*.map'
    ]
  },
  tseslint.configs.base,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2022,
      sourceType: 'commonjs'
    }
  }
)
