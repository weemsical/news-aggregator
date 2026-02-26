/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "services",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
    },
    {
      displayName: "components",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/src"],
      testMatch: ["<rootDir>/src/ui/__tests__/**/*.test.tsx"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "tsconfig.app.json" },
        ],
      },
      moduleNameMapper: {
        "\\.css$": "<rootDir>/src/ui/__tests__/styleMock.js",
      },
      setupFilesAfterEnv: ["<rootDir>/src/ui/__tests__/setup.ts"],
    },
  ],
};
