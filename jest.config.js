const config = {
  verbose: false,
  testEnvironment: "node",
  collectCoverage: false,
  clearMocks: true,
  moduleNameMapper: {
    "^login\\.dfe\\.api-client/api$":
      "<rootDir>/node_modules/login.dfe.api-client/dist/api/index.js",
    "^login\\.dfe\\.api-client/api/common/ApiClient$":
      "<rootDir>/node_modules/login.dfe.api-client/dist/api/common/ApiClient.js",
  },
};

module.exports = config;
