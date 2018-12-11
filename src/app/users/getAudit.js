const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserAudit } = require('./../../infrastructure/audit');
const logger = require('./../../infrastructure/logger');
const { getServiceIdForClientId } = require('./../../infrastructure/serviceMapping');
const { getServiceById } = require('./../../infrastructure/applications');
const { getOrganisationById, getUserOrganisations } = require('./../../infrastructure/organisations');

let cachedServiceIds = {};
let cachedServices  = {};

const describeAuditEvent = async (audit) => {
  if (audit.type === 'sign-in') {
    let description = 'Sign-in';
    switch (audit.subType) {
      case 'username-password':
        description += ' using email address and password';
        break;
      case 'digipass':
        description += ' using a digipass key fob';
        break;
    }
    return description;
  }

  if (audit.type === 'support' && audit.subType === 'user-edit') {
    const viewedUser = await getUserDetails({ params: { uid: audit.editedUser } });
    const editedStatusTo = audit.editedFields && audit.editedFields.find(x => x.name === 'status');
    if (editedStatusTo && editedStatusTo.newValue === 0) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      const reason = audit.reason ? audit.reason : 'no reason given';
      return `${newStatus.description} user: ${viewedUser.firstName} ${viewedUser.lastName} (reason: ${reason})`;
    }
    if (editedStatusTo && editedStatusTo.newValue === 1) {
      return `Reactivated user: ${viewedUser.firstName} ${viewedUser.lastName}`
    }
    if (editedStatusTo) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      return newStatus.description;
    }
    return 'Edited user';
  }

  if (audit.type === 'support' && audit.subType === 'user-view') {
    const viewedUser = await getUserDetails({ params: { uid: audit.viewedUser } });
    return `Viewed user ${viewedUser.firstName} ${viewedUser.lastName}`;
  }

  if (audit.type === 'support' && audit.subType === 'user-search') {
    return `Searched for users using criteria "${audit.criteria}"`;
  }

  if (audit.type === 'change-email' && audit.success) {
    return 'Changed email';
  }

  if (audit.type === 'change-password') {
    return 'Changed password';
  }

  if (audit.type === 'reset-password') {
    return 'Reset password';
  }

  if (audit.type === 'change-name') {
    return 'Changed name'
  }

  if (audit.type === 'support' && audit.subType === 'user-org-deleted') {
    const organisationId = audit.editedFields && audit.editedFields.find(x => x.name === 'new_organisation');
    const organisation = await getOrganisationById(organisationId.oldValue);
    const viewedUser = await getUserDetails({ params: { uid: audit.editedUser } });
    return `Deleted organisation: ${organisation.name} for user  ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  if (audit.type === 'support' && audit.subType === 'user-org') {
    const organisationId = audit.editedFields && audit.editedFields.find(x => x.name === 'new_organisation');
    const organisation = await getOrganisationById(organisationId.newValue);
    const viewedUser = await getUserDetails({ params: { uid: audit.editedUser } });
    return `Added organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  if (audit.type === 'support' && audit.subType === 'user-org-permission-edited') {
    const editedFields = audit.editedFields && audit.editedFields.find(x => x.name === 'edited_permission');
    const viewedUser = await getUserDetails({ params: { uid: audit.editedUser } });
    return `Edited permission level to ${editedFields.newValue} for user ${viewedUser.firstName} ${viewedUser.lastName} in organisation ${editedFields.organisation}`
  }

  return `${audit.type} / ${audit.subType}`;
};

const getCachedServiceIdForClientId = async (client) => {
  if (!(client in cachedServiceIds)){
    cachedServiceIds[client] = await getServiceIdForClientId(client);
  }
  return cachedServiceIds[client]
};

const getCachedServiceById = async (serviceId, reqId) => {
  let key = `${serviceId}:${reqId}`;
  if (!(key in cachedServices)){
    const service = getServiceById(serviceId);
    cachedServices[key] = service;
  }
  return cachedServices[key]
};

const getAudit = async (req, res) => {
  cachedServiceIds = {};
  cachedServices  = {};
  const user = await getUserDetails(req);
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);

  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
    return res.status(400).send();
  }
  const pageOfAudits = await getUserAudit(user.id, pageNumber);

  let audits = [];

  for (let i = 0; i < pageOfAudits.audits.length; i++) {
    let audit = pageOfAudits.audits[i];
    let service = null;
    let organisation = null;
    if (audit.client) {
      const serviceId = await getCachedServiceIdForClientId(audit.client);
      if(serviceId) {
        service = await getCachedServiceById(serviceId, req.id);
      } else {
        logger.info(`User audit tab - No service mapping for client ${audit.client} using client id`);
        service = { name: audit.client };
      }
    }
    if (audit.organisationId) {
      organisation = await getOrganisationById(audit.organisationId);
    }

    audits.push({
      timestamp: new Date(audit.timestamp),
      event: {
        type: audit.type,
        subType: audit.subType,
        description: await describeAuditEvent(audit),
      },
      service,
      organisation,
      result: audit.success === undefined ? true : audit.success,
      user: audit.userId.toLowerCase() === user.id.toLowerCase() ? user : await getUserDetails({ params: { uid: audit.userId } }),
    });
  }

  sendResult(req, res, 'users/views/audit', {
    csrfToken: req.csrfToken(),
    user,
    organisations: userOrganisations,
    audits: audits,
    numberOfPages: pageOfAudits.numberOfPages,
    page: pageNumber,
    totalNumberOfResults: pageOfAudits.numberOfRecords,
  });
};

module.exports = getAudit;
