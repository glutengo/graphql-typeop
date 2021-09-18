export default {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The glob patterns Jest uses to detect test files
  testMatch: [
     "**/?(*.)+(spec|test).ts?(x)"
  ],
};
