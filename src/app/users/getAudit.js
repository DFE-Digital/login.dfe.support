const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');
const { getUserDetailsById } = require('./utils');
const { getPageOfUserAudits, cache } = require('./../../infrastructure/audit');
const logger = require('./../../infrastructure/logger');
const { getServiceIdForClientId } = require('./../../infrastructure/serviceMapping');
const { getServiceById } = require('./../../infrastructure/applications');
const { getOrganisationById, getUserOrganisations } = require('./../../infrastructure/organisations');
const { listRolesOfService } = require('./../../infrastructure/access');

// const { getRoleById } = require('./../../infrastructure/organisations');
// const Sequelize = require('sequelize');
// const { QueryTypes } = Sequelize;
// const { db } = require('./sequelize-schema');



let cachedServiceIds = {};
let cachedServices  = {};
let cachedUsers = {};

const getCachedUserById = async (userId, reqId) => {
  let key = `${userId}:${reqId}`;
  if (!(key in cachedUsers)) {
    const user = await getUserDetailsById(userId, reqId);
    cachedUsers[key] = user;
  }
  return cachedUsers[key];
};

const describeAuditEvent = async (audit, req) => {
  const isCurrentUser = audit.userId.toLowerCase() === req.params.uid.toLowerCase();

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

  if (audit.type === 'Sign-out') {
    return audit.type;
  }

  if (audit.type === 'support' && audit.subType === 'user-edit') {
    const viewedUser = audit.editedUser ? await getCachedUserById(audit.editedUser, req.id) : '';
    const editedStatusTo = audit.editedFields && audit.editedFields.find(x => x.name === 'status');
    if (editedStatusTo && editedStatusTo.newValue === 0) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      const reason = audit.reason ? audit.reason : 'no reason given';
      return isCurrentUser ? `${newStatus.description} user: ${viewedUser.firstName} ${viewedUser.lastName} (reason: ${reason})`
        : ` Account ${newStatus.description} (reason: ${reason})`
    }
    if (editedStatusTo && editedStatusTo.newValue === 1) {
      return isCurrentUser ? `Reactivated user: ${viewedUser.firstName} ${viewedUser.lastName}` : `Account Reactivated`
    }
    if (editedStatusTo) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      return newStatus.description;
    }
    return 'Edited user';
  }

  if (audit.type === 'support' && audit.subType === 'user-view') {
    const viewedUser = audit.viewedUser ?  await getCachedUserById(audit.viewedUser, req.id) : '';
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
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Deleted organisation: ${organisation.name} for user  ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  if (audit.type === 'support' && audit.subType === 'user-org') {
    const organisationId = audit.editedFields && audit.editedFields.find(x => x.name === 'new_organisation');
    const organisation = await getOrganisationById(organisationId.newValue);
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Added organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  if (audit.type === 'support' && audit.subType === 'user-org-permission-edited') {
    const editedFields = audit.editedFields && audit.editedFields.find(x => x.name === 'edited_permission');
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Edited permission level to ${editedFields.newValue} for user ${viewedUser.firstName} ${viewedUser.lastName} in organisation ${editedFields.organisation}`
  }
  // deleted services with roles
  if (audit.type === 'support' && audit.subType === 'user-service-deleted') {
    const serviceId = audit.editedFields && audit.editedFields.find(x => x.name === 'remove_service');
    let msg = '';
    if(serviceId.newValue === undefined)
    {
      const service = await getServiceById(serviceId.oldValue);
      msg = msg + `'${service.name}' - no roles; `;
    }
    else
    {
      for (let i = 0; i < serviceId.newValue.length; i++) {
        if(0 < msg.length) { msg = msg + ', '; }
        const service = await getServiceById(serviceId.newValue[i].serviceId);
        const removedRoles = serviceId.newValue[i].roles;
        msg = msg + `'${service.name}'`;
        if(0 === removedRoles.length)
        {
          msg = msg + ` - no roles; `;
        }
        else
        {
          msg = msg + ` - roles: `;
          const allRolesOfService = await listRolesOfService(service.id, req.id);
          for(let j = 0; j < removedRoles.length; j++)
          {
            let removedRoleId = removedRoles[j];
            const role = allRolesOfService.find(x => x.id.toLowerCase() === removedRoleId.toLowerCase());
            if(role === undefined)
            {
              msg = msg + `'${removedRoleId}'; `;
            }
            else
            {
              msg = msg + `'${role.name}'; `;
            }
          }
        }
      }
    }
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Deleted service: ${msg} for user  ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  // updated services with roles
  if (audit.type === 'support' && audit.subType === 'user-service-updated') {
    const serviceId = audit.editedFields && audit.editedFields.find(x => x.name === 'update_service');
    let msg = '';
    for (let i = 0; i < serviceId.newValue.length; i++) {
      if(0 < msg.length) { msg = msg + ', '; }
      const service = await getServiceById(serviceId.newValue[i].serviceId);
      const postUpdateRoles = serviceId.newValue[i].roles;
      msg = msg + `'${service.name}'`;
      if(0 === postUpdateRoles.length)
      {
        msg = msg + ` - no roles; `;
      }
      else
      {
        msg = msg + ` - post-update roles: `;
        const allRolesOfService = await listRolesOfService(service.id, req.id);
        for(let j = 0; j < postUpdateRoles.length; j++)
        {
          let postUpdateRoleId = postUpdateRoles[j];
          const role = allRolesOfService.find(x => x.id.toLowerCase() === postUpdateRoleId.toLowerCase());
          if(role === undefined)
          {
            msg = msg + `'${postUpdateRoleId}'; `;
          }
          else
          {
            msg = msg + `'${role.name}'; `;
          }
        }
      }
    }
    
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Updated service: ${msg} for user  ${viewedUser.firstName} ${viewedUser.lastName}`
  }
  // added service with roles 
  if (audit.type === 'support' && audit.subType === 'user-services-added') {
    const serviceId = audit.editedFields && audit.editedFields.find(x => x.name === 'add_services');
    let msg = '';
    for (let i = 0; i < serviceId.newValue.length; i++) {
      if(0 < msg.length) { msg = msg + ', '; }
      const service = await getServiceById(serviceId.newValue[i].serviceId);
      const addedRoles = serviceId.newValue[i].roles;

      msg = msg + `'${service.name}'`;
      if(0 === addedRoles.length)
      {
        msg = msg + ` - no roles; `;
      }
      else
      {
        msg = msg + ` - roles: `;
        const allRolesOfService = await listRolesOfService(service.id, req.id);
        for(let j = 0; j < addedRoles.length; j++)
        {
          let addedRoleId = addedRoles[j];
          const role = allRolesOfService.find(x => x.id.toLowerCase() === addedRoleId.toLowerCase());
          if(role === undefined)
          {
            msg = msg + `'${addedRoleId}'; `;
          }
          else
          {
            msg = msg + `'${role.name}'; `;
          }
        }
      }
    }
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Added service: ${msg} for user ${viewedUser.firstName} ${viewedUser.lastName}`
  }

  return `${audit.type} / ${audit.subType}`;
};

const getCachedServiceIdForClientId = async (client) => {
  if (!(client in cachedServiceIds)) {
    cachedServiceIds[client] = await getServiceIdForClientId(client);
  }
  return cachedServiceIds[client];
};

const getCachedServiceById = async (serviceId, reqId) => {
  let key = `${serviceId}:${reqId}`;
  if (!(key in cachedServices)) {
    const service = await getServiceById(serviceId);
    cachedServices[key] = service;
  }
  return cachedServices[key];
};

const getAudit = async (req, res) => {
  cachedServiceIds = {};
  cachedServices = {};
  cachedUsers = {};

  const user = await getCachedUserById(req.params.uid, req.id);
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);

  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
    return res.status(400).send();
  }
  const pageOfAudits = await getPageOfUserAudits(user.id, pageNumber);
  const audits = [];
  const updateInProgress = await cache.getAuditRefreshStatus() === '1';

  for (let i = 0; i < pageOfAudits.audits.length; i++) {
    const audit = pageOfAudits.audits[i];
    let service = null;
    let organisation = null;
    let clientId = audit.client;
    if (!clientId) {
      // try and extract client id from the message as we don't always have metadata available
      const regex = /Authenticated .*? for (.+)/i;
      const match = regex.exec(audit.message);
      if (match !== null && match.length === 2) {
        clientId = match[1];
      }
    }
    if (clientId) {
      // remove double quotes as new audit logger is adding them to string values
      clientId = clientId.replace(/"/g, '');

      const serviceId = await getCachedServiceIdForClientId(clientId);
      if (serviceId) {
        service = await getCachedServiceById(serviceId, req.id);
      } else {
        logger.info(`User audit tab - No service mapping for client ${clientId} using client id`);
        service = { name: clientId };
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
        description: await describeAuditEvent(audit, req),
      },
      service,
      organisation,
      result: audit.success === undefined ? true : audit.success,
      user: audit.userId.toLowerCase() === user.id.toLowerCase() ? user : await getCachedUserById(audit.userId.toUpperCase(), req.id),
    });
  }

  sendResult(req, res, 'users/views/audit', {
    csrfToken: req.csrfToken(),
    user,
    organisations: userOrganisations,
    audits,
    numberOfPages: pageOfAudits.numberOfPages,
    page: pageNumber,
    totalNumberOfResults: pageOfAudits.numberOfRecords,
    updateInProgress,
  });
};

module.exports = getAudit;
