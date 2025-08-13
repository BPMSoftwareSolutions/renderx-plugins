/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.(ts|js)"],
  setupFilesAfterEnv: [
    "<rootDir>/tests/setup/jest.setup.ts",
    "<rootDir>/tests/setup/jest.cia-plugins.setup.ts",
  ],
  globalSetup: "<rootDir>/tests/setup/global-setup.ts",
  globalTeardown: "<rootDir>/tests/setup/global-teardown.ts",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          isolatedModules: true,
          esModuleInterop: true,
          target: "ES2020",
          module: "commonjs",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@communication/(.*)$": "<rootDir>/shims/communication/$1",
  },
  moduleDirectories: ["node_modules", "<rootDir>"],
  // Keep node_modules ignored for speed; we don't need to transform them
  transformIgnorePatterns: ["/node_modules/"],
};

