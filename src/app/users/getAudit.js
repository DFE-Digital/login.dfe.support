const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserAudit } = require('./../../infrastructure/audit');
const { getServiceIdForClientId } = require('./../../infrastructure/serviceMapping');
const { getServiceById } = require('./../../infrastructure/organisations');

const describeAuditEvent = (type, subType) => {
  let description = `${type} / ${subType}`;
  if (type === 'sign-in') {
    description = 'Sign-in';
    switch (subType) {
      case 'username-password':
        description += ' using email address and password';
        break;
      case 'digipass':
        description += ' using a digipass key fob';
        break;
    }
  }
  return description;
};

const getAudit = async (req, res) => {
  const user = await getUserDetails(req);
  const pageOfAudits = await getUserAudit(user.id, 1);

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
        description: describeAuditEvent(audit.type, audit.subType),
      },
      service,
      result: audit.success,
      user: audit.userId === user.id ? user : await getUserDetails(audit.userId),
    }
  }));

  sendResult(req, res, 'users/views/audit', {
    csrfToken: req.csrfToken(),
    user,
    audits: audits,
    numberOfPages: pageOfAudits.numberOfPages,
  });
};

module.exports = getAudit;
