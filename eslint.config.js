import eslint from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["dist"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", {
        fixStyle: "inline-type-imports",
      }],
    }
  },
  {
    languageOptions: { globals: globals.node }
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": ["error", {
        groups: [
          ["^\\u0000", "^node:", "^@?\\w", "^"],
          ["^\\."],
        ],
      }],
    },
  },
];
