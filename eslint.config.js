import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const IGNORE_PATTERNS = [
  "dist",
  "legacy/**",
  "docs/archive/**",
  "scripts/legacy/**",
  "tests/legacy/**"
];

export default tseslint.config(
  {
    ignores: IGNORE_PATTERNS,
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: [
      "src/**/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
      "supabase/**/*.{ts,tsx}"
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-namespace": "off",
      "no-case-declarations": "off",
      "no-prototype-builtins": "off",
      "no-useless-escape": "off",
      "react-hooks/rules-of-hooks": "warn",
    },
  }
);
