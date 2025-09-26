const config = require("./../src/infrastructure/config");
const PolicyEngine = require("login.dfe.policy-engine");
const policyEngine = new PolicyEngine(config);
const { getAllServices } = require("./../src/app/services/utils");

const getPolicyApplicationResult = async (
  userId,
  organisationId,
  serviceId,
) => {
  const policyEngineResult =
    await policyEngine.getPolicyApplicationResultsForUser(
      userId.startsWith("inv-") ? undefined : userId,
      organisationId,
      serviceId,
    );
  return policyEngineResult.rolesAvailableToUser;
};

const getPolicyApplicationForService = async () => {
  // pass 3 params to run for single service (userId, orgId, serviceId)
  const userId = process.argv[2];
  const organisationId = process.argv[3];
  const serviceId = process.argv[4];

  if (!userId || !organisationId || !serviceId) {
    console.info("missing params");
    process.exit();
  }
  const policyResult = await getPolicyApplicationResult(
    userId,
    organisationId,
    serviceId,
  );
  console.info(policyResult);
};

const getPolicyApplicationForServices = async () => {
  // pass 2 params to run for all services (userId, orgId)
  const userId = process.argv[2];
  const organisationId = process.argv[3];

  const allServices = await getAllServices();
  const servicesNotAvailableThroughPolicies = [];
  for (let i = 0; i < allServices.services.length; i++) {
    const policyResult = await policyEngine.getPolicyApplicationResultsForUser(
      !userId || userId.startsWith("inv-") ? undefined : userId,
      organisationId,
      allServices.services[i].id,
    );
    if (!policyResult.serviceAvailableToUser) {
      servicesNotAvailableThroughPolicies.push(allServices.services[i].id);
    }
  }
  const availableServices = allServices.services.filter(
    (x) => !servicesNotAvailableThroughPolicies.find((y) => x.id === y),
  );
  console.info(availableServices);
};

const run = async () => {
  const start = Date.now();
  console.log("now");
  if (process.argv[4] !== undefined) {
    await getPolicyApplicationForService();
  } else {
    await getPolicyApplicationForServices();
  }
  const end = Date.now();
  const time = end - start;
  console.log("Done");
  console.log("Call took: " + time + " milliseconds");
  process.exit(1);
};

run();
