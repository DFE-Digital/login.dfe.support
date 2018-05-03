const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getUser, getUserDevices, getInvitation } = require('./../../infrastructure/directories');
const { getClientIdForServiceId } = require('./../../infrastructure/serviceMapping');
const { getUserLoginAuditsForService } = require('./../../infrastructure/audit');
const logger = require('./../../infrastructure/logger');

const getOrganisations = async (userId, correlationId) => {
  const orgServiceMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
  if (!orgServiceMapping) {
    return [];
  }

  const userMap = [];

  const organisations = await Promise.all(orgServiceMapping.map(async (invitation) => {
    const services = await Promise.all(invitation.services.map(async (service) => {
      const approvers = await Promise.all(invitation.approvers.map(async (approverId) => {
        let approver = userMap.find(u => u.id === approverId);
        if (!approver) {
          const user = await getUser(approverId, correlationId);
          if (!user) {
            return null;
          }
          approver = {
            id: approverId,
            name: `${user.given_name} ${user.family_name}`,
          };
        }

        return approver;
      }));

      return {
        id: service.id,
        name: service.name,
        userType: invitation.role,
        grantedAccessOn: service.requestDate ? new Date(service.requestDate) : null,
        lastLogin: null,
        approvers: approvers.filter(x => x !== null),
        token: null,
      };
    }));

    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
      services,
    };
  }));

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
    if (!serialNumber && invitation.oldCredentials && invitation.oldCredentials.tokenSerialNumber) {
      serialNumber = invitation.oldCredentials.tokenSerialNumber;
    }
    if (serialNumber) {
      return {
        type: 'digipass',
        serialNumber: `${serialNumber.substr(0, 2)}-${serialNumber.substr(2, 7)}-${serialNumber.substr(9, 1)}`,
        nonFormattedSerialNumber: serialNumber,
      };
    }

    if (invitation && invitation.device) {
      serialNumber = invitation.device.serialNumber;
      return {
        type: invitation.device.type,
        serialNumber: `${serialNumber.substr(0, 2)}-${serialNumber.substr(2, 7)}-${serialNumber.substr(9, 1)}`,
        nonFormattedSerialNumber: serialNumber,
      };
    }

    return null;
  } else {
    const tokens = await getUserDevices(userId, correlationId);
    if (!tokens || tokens.length === 0) {
      return null;
    }

    const digipass = tokens.find(t => t.type === 'digipass');
    return {
      type: digipass.type,
      serialNumber: `${digipass.serialNumber.substr(0, 2)}-${digipass.serialNumber.substr(2, 7)}-${digipass.serialNumber.substr(9, 1)}`,
      nonFormattedSerialNumber: digipass.serialNumber,
    };
  }
};

const action = async (req, res) => {
  const user = await getUserDetails(req);
  const organisationDetails = await getOrganisations(user.id, req.id);

  const organisations = [];
  for (let i = 0; i < organisationDetails.length; i++) {
    const org = Object.assign(Object.assign({}, organisationDetails[i]), { services: [] });
    for (let j = 0; j < organisationDetails[i].services.length; j++) {
      const svc = Object.assign({}, organisationDetails[i].services[j]);
      svc.lastLogin = await getLastLoginForService(user.id, svc.id, req.id);
      svc.token = await getToken(user.id, svc.id, req.id);
      org.services.push(svc);
    }
    organisations.push(org);
  }

  req.session.user = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

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