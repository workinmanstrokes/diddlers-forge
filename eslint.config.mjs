// Optional: `npx eslint .` — the studio itself has no dependencies.
export default [
  {
    files: ['**/*.js'],
    ignores: ['data/**'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: { indent: ['warn', 2, { SwitchCase: 1 }], 'no-unused-vars': 'warn', 'no-undef': 'off', eqeqeq: ['warn', 'smart'] },
  },
];
