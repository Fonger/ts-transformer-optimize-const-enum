/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testPathIgnorePatterns: ['dist'],
  coverageReporters: ['text', process.env.CI === 'true' ? 'lcovonly' : 'lcov'],
};
