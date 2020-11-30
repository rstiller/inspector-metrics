module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
      project: "./tsconfig.json"
  },
  plugins: [
      "@typescript-eslint",
  ],
  extends: [
  ],
  rules: {
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/strict-boolean-expressions": "off"
  }
}
