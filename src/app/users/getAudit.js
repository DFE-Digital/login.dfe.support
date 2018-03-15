const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserAudit } = require('./../../infrastructure/audit');
const logger = require('./../../infrastructure/logger');
const { getServiceIdForClientId } = require('./../../infrastructure/serviceMapping');
const { getServiceById } = require('./../../infrastructure/organisations');

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
    const editedStatusTo = audit.editedFields && audit.editedFields.find(x => x.name === 'status');
    if (editedStatusTo && editedStatusTo.newValue === 0) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      const reason = audit.reason ? audit.reason : 'no reason given';
      return `${newStatus.description} (reason: ${reason})`;
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

  if (audit.type === 'change-password') {
    return 'Changed password';
  }

  if (audit.type === 'reset-password') {
    return 'Reset password';
  }

  return `${audit.type} / ${audit.subType}`;
};

const getCachedServiceIdForClientId = async (client) => {
  if (!(client in cachedServiceIds)){
    cachedServiceIds[client] = await getServiceIdForClientId(client);
  }
  return cachedServiceIds[client]
}

const getCachedServiceById = async (serviceId, reqId) => {
  let key = `${serviceId}:${reqId}`;
  if (!(key in cachedServices)){
    const service = getServiceById(serviceId, reqId);
    cachedServices[key] = service;
  }
  return cachedServices[key]
}
const getAudit = async (req, res) => {
  cachedServiceIds = {};
  cachedServices  = {};
  const user = await getUserDetails(req);

  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
    return res.status(400).send();
  }
  const pageOfAudits = await getUserAudit(user.id, pageNumber);

  let audits = [];

  for (let i = 0; i < pageOfAudits.audits.length; i++) {
    let audit = pageOfAudits.audits[i];
    let service = null;
    if (audit.client) {
      const serviceId = await getCachedServiceIdForClientId(audit.client);
      if(serviceId) {
        service = await getCachedServiceById(serviceId, req.id);
      } else {
        logger.info(`User audit tab - No service mapping for client ${audit.client} using client id`);
        service = { name: audit.client };
      }
    }

    audits.push({
      timestamp: new Date(audit.timestamp),
      event: {
        type: audit.type,
        subType: audit.subType,
        description: await describeAuditEvent(audit),
      },
      service,
      result: audit.success === undefined ? true : audit.success,
      user: audit.userId.toLowerCase() === user.id.toLowerCase() ? user : await getUserDetails({ params: { uid: audit.userId } }),
    });
  };


  sendResult(req, res, 'users/views/audit', {
    csrfToken: req.csrfToken(),
    user,
    audits: audits,
    numberOfPages: pageOfAudits.numberOfPages,
    page: pageNumber,
    totalNumberOfResults: pageOfAudits.numberOfRecords,
  });
};

module.exports = getAudit;
