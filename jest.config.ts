
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'], // Adjust if tests are in another directory
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
     '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^vue$': 'vue-demi', // Map Vue to vue-demi for cross-version support
     '^@/(.*)$': '<rootDir>/$1'
  },
  setupFiles: ['<rootDir>/jest.setup.ts'], // Optional: for fetch mocks or test extensions
};
