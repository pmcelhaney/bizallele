module.exports = {
    setupFilesAfterEnv: [
        './tests/jest-helpers/jest.init.js',
        './tests/jest-helpers/raw-sources.js',
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!(@lit/reactive-element|@open-wc/testing-helpers|lit|lit-element|lit-html|yaml)/)',
    ],
    moduleNameMapper: {
        '^@pmcelhaney/bizallele$': '<rootDir>/src/index.js',
        '^@pmcelhaney/bizallele/(.*)$': '<rootDir>/src/$1',
    },
    watchman: false,
    testEnvironment: 'jsdom',
    verbose: false,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text-summary'],
    coverageThreshold: {
        global: {
            lines: 1,
            statements: 1,
            functions: 1,
            branches: 1,
        },
    },
    reporters: ['default'],
    roots: ['./tests'],

    collectCoverageFrom: ['./src/**/*.{js,ts}', '!./src/**/*.d.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.(js|mjs)$': 'babel-jest',
    },
};
