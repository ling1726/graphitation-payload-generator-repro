# Graphitation mock payload generator repro

This project repros the fact that the graphitation mock payload generator does not call mock resolvers for abstract types.

There are two test files:
* Test.test.js - uses RelayMockPayloadGenerator
* TestGraphitation.js - uses Graphitation payload generator

Both test files use the same test component and assert on the same test values.

Simple run:
* npm install
* npx relay-compiler
* npm run test