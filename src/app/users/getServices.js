const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getUserDevices, getInvitation } = require('./../../infrastructure/directories');
const { getClientIdForServiceId } = require('./../../infrastructure/serviceMapping');
const { getUserLoginAuditsForService } = require('./../../infrastructure/audit');
const logger = require('./../../infrastructure/logger');

const getOrganisations = async (userId, correlationId) => {
  const orgServiceMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
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
      id: orgSvcMap.service ? orgSvcMap.service.id : orgSvcMap.id,
      name: orgSvcMap.service ? orgSvcMap.service.name : orgSvcMap.name,
      userType: orgSvcMap.role,
      grantedAccessOn: orgSvcMap.requestDate ? new Date(orgSvcMap.requestDate) : null,
      lastLogin: null,
      approvers: orgSvcMap.approvers ? orgSvcMap.approvers : [],
      token: null,
    });
  });

  return organisations;
};
const getLastLoginForService = async (userId, serviceId) => {
  if (userId.startsWith('inv-')) {
    return null;
  }

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
  if (userId.startsWith('inv-')) {
    const invitation = await getInvitation(userId.substr(4), correlationId);
    let serialNumber = invitation.tokenSerialNumber;
    if (!serialNumber && invitation.oldCredentials.tokenSerialNumber) {
      serialNumber = invitation.oldCredentials.tokenSerialNumber;
    }
    if (!serialNumber) {
      return null;
    }
    return {
      type: 'digipass',
      serialNumber: `${serialNumber.substr(0, 2)}-${serialNumber.substr(2, 7)}-${serialNumber.substr(9, 1)}`,
    };
  } else {
    const tokens = await getUserDevices(userId, correlationId)
    if (!tokens || tokens.length === 0) {
      return null;
    }

    const digipass = tokens.find(t => t.type === 'digipass');
    return {
      type: digipass.type,
      serialNumber: `${digipass.serialNumber.substr(0, 2)}-${digipass.serialNumber.substr(2, 7)}-${digipass.serialNumber.substr(9, 1)}`,
    };
  }
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

  logger.audit(`${req.user.email} (id: ${req.user.sub}) viewed user ${user.email} (id: ${user.id})`, {
    type: 'support',
    subType: 'user-view',
    userId: req.user.sub,
    userEmail: req.user.email,
    viewedUser: user.id,
  });

  sendResult(req, res, 'users/views/services', {
    csrfToken: req.csrfToken(),
    user,
    organisations,
    isInvitation: req.params.uid.startsWith('inv-'),
  });
};

module.exports = action;