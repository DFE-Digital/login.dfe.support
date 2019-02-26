const getAllAuditsSince = async (sinceDate) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "username-password",
      success: true,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
  });
};

const getUserAudit = async (userId, pageNumber) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "username-password",
      success: true,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
    numberOfRecords: 1,
  });
};

const getPageOfUserAudits = async (userId, pageNumber) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "username-password",
      success: true,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
    numberOfRecords: 1,
  });
};

const getUserLoginAuditsSince = async (userId, sinceDate) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "username-password",
      success: true,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
  });
};

const getUserLoginAuditsForService = async (userId, serviceId, pageNumber) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "username-password",
      success: true,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
  });
};

const getUserChangeHistory = async (userId, pageNumber) => {
  return Promise.resolve({
    audits: [{
      type: 'support',
      subType: 'user-edit',
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      userEmail: "some.user@test.tester",
      editedUser: userId,
      editedFields: [
        {
          name: 'status',
          oldValue: 1,
          newValue: 0,
        }
      ],
      level: "audit",
      message: "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
    numberOfRecords: 1,
  })
};

const getTokenAudits = async (userId,serialNumber, pageNumber) => {
  return Promise.resolve({
    audits: [{
      type: "sign-in",
      subType: "digipass",
      success: true,
      userId: userId,
      userEmail: "some.user@test.tester",
      level: "audit",
      message: "Successful digipass challenge/response for (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
      timestamp: "2017-10-24T12:35:51.633Z"
    }],
    numberOfPages: 1,
  });
};

module.exports = {
  getAllAuditsSince,
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getTokenAudits,
  getPageOfUserAudits,
};
