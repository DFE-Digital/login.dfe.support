const config = require('./../src/infrastructure/config');
const PolicyEngine = require('login.dfe.policy-engine');
const policyEngine = new PolicyEngine(config);
const {Connection, Request} = require('tedious');
const { updateUserService } = require('./../src/infrastructure/access');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const getPolicyApplicationResult = async (userId, organisationId, serviceId) => {
  const policyEngineResult = await policyEngine.getPolicyApplicationResultsForUser(userId.startsWith('inv-') ? undefined : userId, organisationId, serviceId);
  return policyEngineResult.rolesAvailableToUser;
};

const connection = new Connection({
  server: '',
  userName: '',
  password: '',
  options: {
    database: '',
    encrypt: true,
  },
});

const getNumberOfAvailableRoles = async () => {
  const twoAvailableRoles = [];
  const moreThanTwoRoles = [];
  const lessThanTwoRoles = [];
  let data = await executeQuery();
  console.log("done : ", data.length);
  for (let i = 0; i < data.length; i++) {
    const policyResult = await getPolicyApplicationResult(data[i].userId, data[i].organisationId, data[i].serviceId);
    if(policyResult.length === 2) {
      twoAvailableRoles.push({
        userId: data[i].userId,
        organisationId: data[i].organisationId,
        serviceId: data[i].serviceId,
        policyResult,
      });
      console.log('Pushing to two available roles : ', i);

    } else if (policyResult.length > 2) {
      moreThanTwoRoles.push(policyResult);
      console.log('Pushing to more than two available roles')
    } else {
      lessThanTwoRoles.push(policyResult);
      console.log('Pushing to less than two available roles')
    }
  }
  console.log('Two available roles length: ' + twoAvailableRoles.length);
  console.log('More than two available roles length ' + moreThanTwoRoles.length);
  console.log('Less than two available roles length ' + lessThanTwoRoles.length);

  return {
    twoAvailableRoles,
    lessThanTwoRoles,
    moreThanTwoRoles,
  }
};

const updateUserRoles = async () => {
  const policy = await getNumberOfAvailableRoles();
  console.log('Starting update services');
  console.info(policy.twoAvailableRoles);
  if (policy.twoAvailableRoles.length > 0) {
    for (let i = 0; i < policy.twoAvailableRoles.length; i++) {
      const currentPolicy = policy.twoAvailableRoles[i];
      const roles = currentPolicy.policyResult.map(x => x.id);
      console.log(roles);
      // update roles
      await updateUserService(currentPolicy.userId, currentPolicy.serviceId, currentPolicy.organisationId, roles, 'gias-dev-script');

      // send ws sync
      const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
      let somthing = await serviceNotificationsClient.notifyUserUpdated({ sub: currentPolicy.userId });
      console.log('Queued user sync : ', somthing);
    }
  }


  return console.log(`Finished updating roles for ${policy.twoAvailableRoles.length} users`)
};

const executeQuery = async () => {
  const data = [];
  return new Promise((resolve, reject) => {
    connection.on('connect', (err) => {
      if (err) {
        console.log(err.message);
      } else {
        const request = new Request('select user_id, service_id, organisation_id, count(role_id) from user_service_roles ' +
          'group by user_id, service_id, organisation_id ' +
          'having service_id = \'2354cb2e-f559-4bf4-9981-4f6c6890aa5e\' and (count(role_id) < 2 or count(role_id) > 2)', (err, rowCount) => {
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
