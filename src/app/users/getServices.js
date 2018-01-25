const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations } = require('./../../infrastructure/organisations');
const { getUserDevices } = require('./../../infrastructure/directories');
const { getClientIdForServiceId } = require('./../../infrastructure/serviceMapping');
const { getUserLoginAuditsForService } = require('./../../infrastructure/audit');

const getOrganisations = async (userId, correlationId) => {
  const orgServiceMapping = await getUserOrganisations(userId, correlationId);
  if (!orgServiceMapping) {
    return [];
  }

  const organisations = [];
  orgServiceMapping.forEach((orgSvcMap) => {
    let org = organisations.find(o => o.id === orgSvcMap.organisation.id);
    if (!org) {
      org = {
        id: orgSvcMap.organisation.id,
        name: orgSvcMap.organisation.name,
        services: [],
      };
      organisations.push(org);
    }
    org.services.push({
      id: orgSvcMap.id,
      name: orgSvcMap.name,
      userType: orgSvcMap.role,
      grantedAccessOn: new Date(orgSvcMap.requestDate),
      lastLogin: null,
      approvers: orgSvcMap.approvers,
      token: null,
    });
  });

  return organisations;
};
const getLastLoginForService = async (userId, serviceId) => {
  const clientId = await getClientIdForServiceId(serviceId);
  if (!clientId) {
    return null;
  }

  let lastLogin = null;
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages && !lastLogin) {
    const page = await getUserLoginAuditsForService(userId, clientId, pageNumber);
    const successLogin = page.audits.find(x => x.success);
    if (successLogin) {
      lastLogin = new Date(successLogin.timestamp);
    }

    pageNumber++;
    hasMorePages = pageNumber <= page.numberOfPages;
  }
  return lastLogin;
};
const getToken = async (userId, serviceId, correlationId) => {
  const tokens = await getUserDevices(userId, correlationId)
  if (!tokens || tokens.length === 0) {
    return null;
  }

  const digipass = tokens.find(t => t.type === 'digipass');
  return {
    type: digipass.type,
    serialNumber: `${digipass.serialNumber.substr(0, 2)}-${digipass.serialNumber.substr(2, 7)}-${digipass.serialNumber.substr(9, 1)}`,
  };
};

const action = async (req, res) => {
  const user = await getUserDetails(req);
  const organisationDetails = await getOrganisations(user.id, req.id);
  const organisations = await Promise.all(organisationDetails.map(async (org) => {
    org.services = await Promise.all(org.services.map(async (svc) => {
      svc.lastLogin = await getLastLoginForService(user.id, svc.id, req.id);
      svc.token = await getToken(user.id, svc.id, req.id);
      return svc;
    }));
    return org;
  }));

  sendResult(req, res, 'users/views/services', {
    csrfToken: req.csrfToken(),
    user,
    organisations,
  });
};

module.exports = action;