const config = require('./../src/infrastructure/config');
const PolicyEngine = require('login.dfe.policy-engine');
const policyEngine = new PolicyEngine(config);
const {Connection, Request} = require('tedious');
const { updateUserService, removeServiceFromUser } = require('./../src/infrastructure/access');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const { createWriteStream } = require('fs');
const homeDirectory = require("os").homedir();

const service = {
  requiredRolesForService: 2,
  name: '',
  id: ''
};

const getPolicyApplicationResult = async (userId, organisationId, serviceId) => {
  const policyEngineResult = await policyEngine.getPolicyApplicationResultsForUser(userId.startsWith('inv-') ? undefined : userId, organisationId, serviceId);
  return policyEngineResult.rolesAvailableToUser;
};

const connection = new Connection(config.db);

const getNumberOfAvailableRoles = async () => {
  const equalToRequiredRolesAvailable = [];
  const moreThanRequiredRolesAvailable = [];
  const lessThanRequiredRolesAvailable = [];
  const noRolesAvailable = [];

  let data = await executeQuery();
  console.log("done : ", data.length);
  for (let i = 0; i < data.length; i++) {
    const policyResult = await getPolicyApplicationResult(data[i].userId, data[i].organisationId, data[i].serviceId);
    if (policyResult.length === service.requiredRolesForService) {
      equalToRequiredRolesAvailable.push({
        userId: data[i].userId,
        organisationId: data[i].organisationId,
        serviceId: data[i].serviceId,
        policyResult,
      });
      console.log(`Pushing to ${service.requiredRolesForService} available roles : `, i);

    } else if (policyResult.length === 0) {
      noRolesAvailable.push({
        userId: data[i].userId,
        organisationId: data[i].organisationId,
        serviceId: data[i].serviceId,
        policyResult,
      });
      console.log('Pushing to no available roles : ', i);

    } else if (policyResult.length > service.requiredRolesForService) {
      moreThanRequiredRolesAvailable.push({
        userId: data[i].userId,
        organisationId: data[i].organisationId,
        serviceId: data[i].serviceId,
        policyResult,
      });
      console.log(`Pushing to more than ${service.requiredRolesForService} available roles`)
    } else {
      lessThanRequiredRolesAvailable.push({
        userId: data[i].userId,
        organisationId: data[i].organisationId,
        serviceId: data[i].serviceId,
        policyResult,
      });
      console.log(`Pushing to less than ${service.requiredRolesForService} available roles`)
    }
  }
  console.log('Equal to required roles length : ' + equalToRequiredRolesAvailable.length);
  console.log('More than required roles available length ' + moreThanRequiredRolesAvailable.length);
  console.log('Less than required roles available length ' + lessThanRequiredRolesAvailable.length);
  console.log('No available roles length ' + noRolesAvailable.length);

  return {
    equalToRequiredRolesAvailable,
    lessThanRequiredRolesAvailable,
    moreThanRequiredRolesAvailable,
    noRolesAvailable,
  }
};

const updateUserRoles = async () => {
  const policy = await getNumberOfAvailableRoles();
  console.log('Starting update services');
  console.info(policy.equalToRequiredRolesAvailable);

  if (policy.equalToRequiredRolesAvailable.length > 0) {
    for (let i = 0; i < policy.equalToRequiredRolesAvailable.length; i++) {
      const currentPolicy = policy.equalToRequiredRolesAvailable[i];
      const roles = currentPolicy.policyResult.map(x => x.id);
      console.log(roles);
      // update roles
      await updateUserService(currentPolicy.userId, currentPolicy.serviceId, currentPolicy.organisationId, roles, `${service.name}-dev-script`);

      // send ws sync
      const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
      let somthing = await serviceNotificationsClient.notifyUserUpdated({ sub: currentPolicy.userId });
      console.log('Queued user sync : ', somthing);
    }
  }

  if (policy.noRolesAvailable.length > 0) {
    for (let i = 0; i < policy.noRolesAvailable.length; i++) {
      const currentPolicy = policy.noRolesAvailable[i];

      // remove user with no roles from service
      await removeServiceFromUser(currentPolicy.userId, currentPolicy.serviceId, currentPolicy.organisationId, `${service.name}-dev-script`);
      console.log(`removed ${currentPolicy.userId} from ${currentPolicy.serviceId} for org ${currentPolicy.organisationId} as they had no available roles`);

      // send ws sync
      const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
      const ws = await serviceNotificationsClient.notifyUserUpdated({ sub: currentPolicy.userId });
      console.log('Queued user sync : ', ws);
    }
  }

  if (policy.moreThanRequiredRolesAvailable.length > 0) {
    const stream = createWriteStream(`${homeDirectory}/Desktop/DSI/${service.name}-more-than.csv`);
    console.log('writing users with more than two available roles');
    for (let i = 0; i < policy.moreThanRequiredRolesAvailable.length; i++) {
      const currentPolicy = policy.moreThanRequiredRolesAvailable[i];
      stream.write(`=HYPERLINK(https://support.signin.education.gov.uk/users/${currentPolicy.userId}/organisations/${currentPolicy.organisationId}/services/${currentPolicy.serviceId})`);
      stream.write('\r\n');
    }
  }

  if (policy.lessThanRequiredRolesAvailable.length > 0) {
    const stream = createWriteStream(`${homeDirectory}/Desktop/DSI/${service.name}-less-than.csv`);
    console.log('writing users with less than two available roles');
    for (let i = 0; i < policy.lessThanRequiredRolesAvailable.length; i++) {
      const currentPolicy = policy.lessThanRequiredRolesAvailable[i];
      stream.write(`=HYPERLINK(https://support.signin.education.gov.uk/users/${currentPolicy.userId}/organisations/${currentPolicy.organisationId}/services/${currentPolicy.serviceId})`);
      stream.write('\r\n')
    }
  }
  console.log(`Updated roles for ${policy.equalToRequiredRolesAvailable.length} users`);
  console.log(`Removed ${policy.noRolesAvailable.length} users from service as they had no available roles`);
};

const executeQuery = async () => {
  const data = [];
  return new Promise((resolve, reject) => {
    connection.on('connect', (err) => {
      if (err) {
        console.log(err.message);
      } else {
        const request = new Request('select us.user_id, us.service_id, us.organisation_id, count(usr.role_id) from user_services us ' +
        'left join user_service_roles usr on us.user_id = usr.user_id and us.service_id = usr.service_id and us.organisation_id = usr.organisation_id ' +
        'group by us.user_id, us.service_id, us.organisation_id ' +
        `having us.service_id = \'${service.id}\' and (count(usr.role_id) < ${service.requiredRolesForService} or count(usr.role_id) > ${service.requiredRolesForService})`, (err, rowCount) => {
          if (err) {
            console.log(err);
          } else {
            console.log(rowCount + ' rows');
          }
          connection.close();
        });

        request.on('row', (row) => {

          let theRow = {
            userId: row[0].value,
            serviceId: row[1].value,
            organisationId: row[2].value,
            numberOfRoles: row[3].value,
          };

          // console.info(theRow);
          data.push(theRow);
        });
        request.on('error', (err)=> {
          reject(err);
        });
        request.on('requestCompleted', () => {
          resolve(data);
        });
        connection.execSql(request);
      }
    });
  });

};

updateUserRoles();
