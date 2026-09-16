const PolicyEngine = require("login.dfe.policy-engine");
const config = require("./../config");

/**
 * Single shared PolicyEngine instance.
 *
 * `registerApiClient: true` is required here: npm cannot dedupe
 * login.dfe.policy-engine's login.dfe.api-client dependency against this
 * app's own (major versions have diverged), so policy-engine resolves its
 * own separate copy of login.dfe.api-client with an independent config
 * singleton. Without this, that copy never gets configured and throws
 * "No active configuration for DfE Sign-in API." on first use.
 */
module.exports = new PolicyEngine(config, { registerApiClient: true });
