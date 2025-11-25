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

/**
 * Custom ESLint rule to prevent variant="outline" usage
 * Per platform design system: No white button outlines anywhere
 * See: /docs/Platform Performance & UI Consistency.md
 */
const noOutlineVariantRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow variant=\"outline\" or variant='outline' in Button components",
      category: "Design System",
      recommended: true,
    },
    messages: {
      noOutlineVariant: "Do not use variant=\"outline\" - use variant=\"secondary\" or variant=\"ghost\" instead. See /docs/Platform Performance & UI Consistency.md",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === "variant") {
          const value = node.value;

          // Check for literal string "outline" or 'outline'
          if (value?.type === "Literal" && value.value === "outline") {
            context.report({
              node,
              messageId: "noOutlineVariant",
            });
          }

          // Check for JSX expression with 'outline' or "outline"
          if (value?.type === "JSXExpressionContainer") {
            const sourceCode = context.getSourceCode().getText(value.expression);

            // Match 'outline' or "outline" in the expression
            if (sourceCode.includes("'outline'") || sourceCode.includes('"outline"')) {
              context.report({
                node,
                messageId: "noOutlineVariant",
              });
            }
          }
        }
      },

      // Check function/variable default parameters
      AssignmentPattern(node) {
        if (node.left?.name === "variant" && node.right?.type === "Literal") {
          if (node.right.value === "outline") {
            context.report({
              node,
              messageId: "noOutlineVariant",
            });
          }
        }
      },

      // Check object property values
      Property(node) {
        if (node.key?.name === "variant" && node.value?.type === "Literal") {
          if (node.value.value === "outline") {
            context.report({
              node,
              messageId: "noOutlineVariant",
            });
          }
        }
      },
    };
  },
};

// Custom plugin with our rule
const customDesignSystemPlugin = {
  rules: {
    "no-outline-variant": noOutlineVariantRule,
  },
};

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
      "design-system": customDesignSystemPlugin,
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
      "design-system/no-outline-variant": "error",
    },
  }
);
