/** @type {import('jest').Config} */

const pathAliases = {
  "^@types$": "<rootDir>/src/types/index.ts",
  "^@repositories$": "<rootDir>/src/repositories/index.ts",
  "^@services$": "<rootDir>/src/services/index.ts",
};

module.exports = {
  projects: [
    {
      displayName: "services",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
      moduleNameMapper: pathAliases,
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
        ...pathAliases,
      },
      setupFilesAfterEnv: ["<rootDir>/src/ui/__tests__/setup.ts"],
    },
  ],
};
