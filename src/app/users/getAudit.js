const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserAudit } = require('./../../infrastructure/audit');
const { getServiceIdForClientId } = require('./../../infrastructure/serviceMapping');
const { getServiceById } = require('./../../infrastructure/organisations');

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
    const editedStatusTo = audit.editedFields.find(x => x.name === 'status');
    if (editedStatusTo) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      const reason = audit.reason ? audit.reason : 'no reason given';
      return `${newStatus.description} (reason: ${reason})`;
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

const getAudit = async (req, res) => {
  const user = await getUserDetails(req);

  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
    return res.status(400).send();
  }
  const pageOfAudits = await getUserAudit(user.id, pageNumber);

  const audits = await Promise.all(pageOfAudits.audits.map(async (audit) => {
    let service = null;
    if (audit.client) {
      const serviceId = await getServiceIdForClientId(audit.client);
      service = await getServiceById(serviceId, req.id);
    }

    return {
      timestamp: new Date(audit.timestamp),
      event: {
        type: audit.type,
        subType: audit.subType,
        description: await describeAuditEvent(audit),
      },
      service,
      result: audit.success === undefined ? true : audit.success,
      user: audit.userId === user.id ? user : await getUserDetails({ params: { uid: audit.userId } }),
    }
  }));

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
