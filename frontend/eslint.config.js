import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Sans cette regle, un identifiant utilise uniquement dans le JSX
      // (<Icon />, <motion.div>) est signale a tort comme inutilise.
      'react/jsx-uses-vars': 'error',

      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          // Composants recus en parametre puis rendus en JSX : ({ icon: Icon })
          argsIgnorePattern: '^[A-Z_]|^_',
        },
      ],

      // Les catch vides sont volontaires : l'echec est deja gere par le finally
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Regles issues du React Compiler : signalees comme pistes
      // d'optimisation, sans bloquer l'integration continue.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Les tests manipulent volontairement des variables de portee externe
    // (mocks, espions) : les regles de purete ne s'y appliquent pas.
    files: ['src/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'react-hooks/globals': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
