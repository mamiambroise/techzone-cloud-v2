import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);

const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  rootDir: '.',

  testEnvironment: 'node',

  extensionsToTreatAsEsm: ['.ts'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.spec.json',
      },
    ],
  },

  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, {
      prefix: '<rootDir>/',
      useESM: true,
    }),
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(.*?/node_modules/@nestjs/.*)|(.*?/node_modules/@prisma/.*))',
  ],

  moduleFileExtensions: ['js', 'json', 'ts'],

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],

  coverageDirectory: './coverage',
};

export default config;
