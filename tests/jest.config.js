module.exports = {
  // Test environment
  testEnvironment: "jsdom",

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Test file patterns
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.test.jsx"],

  // Coverage configuration
  collectCoverageFrom: [
    "book-world-main/backend/**/*.js",
    "book-world-main/frontend/src/**/*.{js,jsx}",
    "!book-world-main/backend/node_modules/**",
    "!book-world-main/frontend/node_modules/**",
    "!book-world-main/backend/seed.js",
    "!book-world-main/frontend/src/main.jsx",
    "!book-world-main/frontend/src/index.css",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Module name mapping
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/book-world-main/frontend/src/$1",
    "^@backend/(.*)$": "<rootDir>/book-world-main/backend/$1",
  },

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Module file extensions
  moduleFileExtensions: ["js", "jsx", "json"],

  // Test path ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Environment variables for tests
  setupFiles: ["<rootDir>/tests/env-setup.js"],

  // Global test configuration
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },

  // Collect coverage from specific directories
  collectCoverage: true,

  // Coverage directory
  coverageDirectory: "coverage",

  // Coverage exclude patterns
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/coverage/",
    "/dist/",
    "/build/",
    "jest.config.js",
    "babel.config.js",
  ],

  // Test results processor
  testResultsProcessor: "jest-sonar-reporter",

  // Watch plugins
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],

  // Projects for different test types
  projects: [
    {
      displayName: "Backend Tests",
      testMatch: ["<rootDir>/tests/backend/**/*.test.js"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/backend/setup.js"],
    },
    {
      displayName: "Frontend Tests",
      testMatch: ["<rootDir>/tests/frontend/**/*.test.jsx"],
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/tests/frontend/setup.js"],
    },
  ],

  // Reporters
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "reports/junit",
        outputName: "js-test-results.xml",
        classNameTemplate: "{classname}-{title}",
        titleTemplate: "{classname}-{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
  ],

  // Notify mode
  notify: true,

  // Notify mode configuration
  notifyMode: "always",

  // Error on missing coverage
  errorOnDeprecated: true,

  // Force exit
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Run tests in band
  runInBand: false,

  // Max workers
  maxWorkers: "50%",

  // Cache directory
  cacheDirectory: ".jest-cache",

  // Cache key
  cacheKey: "jest-cache-key",

  // Reset modules
  resetModules: true,

  // Reset mocks
  resetMocks: true,

  // Restore mocks
  restoreMocks: true,

  // Clear mocks
  clearMocks: true,

  // Test location in results
  testLocationInResults: true,

  // Update snapshots
  updateSnapshot: false,

  // Watch mode
  watch: false,

  // Watch all
  watchAll: false,

  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/coverage/",
  ],

  // Watch plugins
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],

  // Extra globals
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },

  // Module directories
  moduleDirectories: ["node_modules", "src"],

  // Module paths
  modulePaths: ["<rootDir>/book-world-main/frontend/src"],

  // Roots
  roots: [
    "<rootDir>/tests",
    "<rootDir>/book-world-main/backend",
    "<rootDir>/book-world-main/frontend/src",
  ],

  // Test environment options
  testEnvironmentOptions: {
    url: "http://localhost",
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    "/node_modules/(?!(axios|react|react-dom|@testing-library)/)",
  ],

  // Unmocked module path patterns
  unmockedModulePathPatterns: [
    "<rootDir>/node_modules/react",
    "<rootDir>/node_modules/react-dom",
  ],

  // Snapshot serializers
  snapshotSerializers: ["enzyme-to-json/serializer"],

  // Test sequencer
  testSequencer: "<rootDir>/tests/test-sequencer.js",

  // Global setup
  globalSetup: "<rootDir>/tests/global-setup.js",

  // Global teardown
  globalTeardown: "<rootDir>/tests/global-teardown.js",
};
