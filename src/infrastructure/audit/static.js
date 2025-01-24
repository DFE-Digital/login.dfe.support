const getAllAuditsSince = async () => {
  return Promise.resolve({
    audits: [
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
  });
};

const getUserAudit = async () => {
  return Promise.resolve({
    audits: [
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
    numberOfRecords: 1,
  });
};

const getPageOfUserAudits = async () => {
  return Promise.resolve({
    audits: [
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
    numberOfRecords: 1,
  });
};

const getUserLoginAuditsSince = async () => {
  return Promise.resolve({
    audits: [
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
  });
};

const getUserLoginAuditsForService = async () => {
  return Promise.resolve({
    audits: [
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
  });
};

const getUserChangeHistory = async (userId) => {
  return Promise.resolve({
    audits: [
      {
        type: "support",
        subType: "user-edit",
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        editedUser: userId,
        editedFields: [
          {
            name: "status",
            oldValue: 1,
            newValue: 0,
          },
        ],
        level: "audit",
        message:
          "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
        timestamp: "2017-10-24T12:35:51.633Z",
      },
    ],
    numberOfPages: 1,
    numberOfRecords: 1,
  });
};

module.exports = {
  getAllAuditsSince,
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getPageOfUserAudits,
};
