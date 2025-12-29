const nextJest = require('next/jest');
const path = require('path');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/setup.ts'],
  setupFiles: ['<rootDir>/jest-setup-globals.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  modulePaths: ['<rootDir>'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        paths: {
          '@/*': ['./*']
        }
      }
    }]
  },
  resolver: undefined,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/cypress/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!next.config.js',
    '!next.config.ts',
    '!tailwind.config.js',
    '!postcss.config.mjs',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Configuración de cobertura
  collectCoverage: false,
  
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
    '!**/tests/e2e/**/*.(spec).(js|jsx|ts|tsx)',
    '!**/cypress/**/*'
  ],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Configuración específica para tests
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  verbose: false,
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth/core)/)',
    '^.+\.module\.(css|sass|scss)$',
  ],
  
  // Projects configuration for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/__tests__/hooks/**/*.(test|spec).(ts|tsx)',
        '<rootDir>/__tests__/lib/**/*.(test|spec).(ts|tsx)',
        '<rootDir>/__tests__/components/**/*.(test|spec).(ts|tsx)'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.(test|spec).(ts|tsx)',
        '<rootDir>/__tests__/app/api/**/*.(test|spec).(ts|tsx)'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
    },
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/__tests__/performance/**/*.(test|spec).(ts|tsx)'
      ],
      testEnvironment: 'node',
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
    }
  ],
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Max workers for parallel execution
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
  
  // Test results processor
  testResultsProcessor: '<rootDir>/__tests__/setup/testResultsProcessor.js'
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);