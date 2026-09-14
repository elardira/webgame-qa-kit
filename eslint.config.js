export default [
  {
    ignores: ["dist/**", "node_modules/**", ".qa-output/**", "playwright-report/**", "test-results/**"]
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        history: "readonly",
        localStorage: "readonly",
        location: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        structuredClone: "readonly",
        URL: "readonly",
        window: "readonly"
      }
    },
    rules: {
      "eqeqeq": "error",
      "no-undef": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-var": "error",
      "prefer-const": "error"
    }
  }
];
