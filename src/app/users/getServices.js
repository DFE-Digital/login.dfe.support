const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getUserDevices, getInvitation } = require('./../../infrastructure/directories');
const { getAllServices } = require('./../../infrastructure/applications');
const logger = require('./../../infrastructure/logger');

const getOrganisations = async (userId, correlationId) => {
  const orgServiceMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
  if (!orgServiceMapping) {
    return [];
  }


  const organisations = await Promise.all(orgServiceMapping.map(async (invitation) => {
    const services = await Promise.all(invitation.services.map(async (service) => {

      return {
        id: service.id,
        name: service.name,
        userType: invitation.role,
        grantedAccessOn: service.requestDate ? new Date(service.requestDate) : null,
        lastLogin: null,
        token: null,
      };
    }));

    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
      urn: invitation.organisation.urn,
      uid: invitation.organisation.uid,
      upin: invitation.organisation.upin,
      ukprn: invitation.organisation.ukprn,
      status: invitation.organisation.status,
      services,
    };
  }));

  return organisations;
};

const getToken = async (userId, correlationId) => {
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
  const token = await getToken(user.id, req.id);
  const allServices = await getAllServices();
  const externalServices = allServices.services.filter(x => x.isExternalService === true && !(x.relyingParty && x.relyingParty.params && x.relyingParty.params.hideSupport === 'true'));

  const organisations = [];
  for (let i = 0; i < organisationDetails.length; i++) {
    const org = Object.assign(Object.assign({}, organisationDetails[i]), { services: [], naturalIdentifiers: [] });
    org.naturalIdentifiers = [];
    const urn = org.urn;
    const uid = org.uid;
    const upin = org.upin;
    const ukprn = org.ukprn;
    if (urn) {
      org.naturalIdentifiers.push(`URN: ${urn}`)
    }
    if (uid) {
      org.naturalIdentifiers.push(`UID: ${uid}`)
    }
    if (upin) {
      org.naturalIdentifiers.push(`UPIN: ${upin}`)
    }
    if (ukprn) {
      org.naturalIdentifiers.push(`UKPRN: ${ukprn}`)
    }

    for (let j = 0; j < organisationDetails[i].services.length; j++) {
      const svc = Object.assign({}, organisationDetails[i].services[j]);
      const isExternalService = externalServices.find(x => x.id === svc.id);
      if (isExternalService) {
        svc.token = token;
        org.services.push(svc);
      }
    }
    organisations.push(org);
  }
  req.session.type = 'services';
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
