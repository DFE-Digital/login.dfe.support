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

module.exports = {
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
};
