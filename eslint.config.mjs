import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// Flat-config migration of the former .eslintrc.cjs (ESLint 10 dropped
// eslintrc support). `flat/recommended` wires the @typescript-eslint parser,
// plugin, recommended rules, and the eslint-recommended core-rule overrides.
export default [
  { ignores: ["dist", "dist-electron", "release"] },
  js.configs.recommended,
  ...tseslint.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
