jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/access");
jest.mock("./../../../src/infrastructure/organisations");

const logger = require("../../../src/infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  rejectOpenOrganisationRequestsForUser,
  rejectOpenUserServiceRequestsForUser,
  removeAllServicesForUser,
  updateUserDetails,
} = require("../../../src/app/users/utils");
const { deactivate } = require("../../../src/infrastructure/directories");
const {
  getUserServiceRequestsByUserId,
  getServicesByUserId,
  updateUserServiceRequest,
  removeServiceFromUser,
} = require("../../../src/infrastructure/access");
const {
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
} = require("../../../src/infrastructure/organisations");
const postConfirmDeactivate = require("../../../src/app/users/postConfirmDeactivate");
const { sendResult } = require("../../../src/infrastructure/utils");

let req;
let res;

const userId = "915a7382-576b-4699-ad07-a9fd329d3867";

beforeEach(() => {
  req = {
    id: "correlationId",
    csrfToken: () => "token",
    accepts: () => ["text/html"],
    params: {
      uid: userId,
    },
    body: {
      reason: "some reason for deactivation",
    },
    user: {
      sub: "suser1",
      email: "super.user@unit.test",
    },
  };

  res = {
    redirect: jest.fn(),
  };

  logger.audit.mockReset();

  getUserDetails.mockReset().mockReturnValue({
    id: userId,
    name: "Rupert Grint",
    firstName: "Rupert",
    lastName: "Grint",
    email: "rupert.grint@hogwarts.test",
    organisationName: "Hogwarts School of Witchcraft and Wizardry",
    lastLogin: null,
    status: {
      id: 1,
      description: "Active",
    },
    loginsInPast12Months: {
      successful: 0,
    },
  });

  getUserDetailsById.mockReset().mockReturnValue({
    id: userId,
    name: "Rupert Grint",
    firstName: "Rupert",
    lastName: "Grint",
    email: "rupert.grint@hogwarts.test",
    organisationName: "Hogwarts School of Witchcraft and Wizardry",
    lastLogin: null,
    status: {
      id: 1,
      description: "Active",
    },
    loginsInPast12Months: {
      successful: 0,
    },
  });

  updateUserDetails.mockReset();

  getUserServiceRequestsByUserId.mockReset().mockReturnValue([
    {
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
      serviceId: "7B7E2D82-1228-4547-907C-40A2A35D0704",
      organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
      status: 2,
      createdAt: "2024-06-04T09:47:36.718Z",
      updatedAt: "2024-06-09T00:00:00.173Z",
      requestType: "service",
    },
  ]);

  getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue([
    {
      id: "requestId",
      org_id: "org1",
      org_name: "org name",
      urn: null,
      ukprn: null,
      uid: null,
      org_status: {
        id: 1,
        name: "Open",
      },
      user_id: "user 1",
      created_at: "12/12/2019",
      status: {
        id: 0,
        name: "pending",
      },
    },
  ]);

  getServicesByUserId.mockReset().mockReturnValue([
    {
      userId: "user-1",
      serviceId: "service1Id",
      organisationId: "organisation-1",
      roles: [],
    },
    {
      userId: "user-1",
      serviceId: "service2Id",
      organisationId: "organisation-1",
      roles: [],
    },
  ]);
});

describe("When confirming deactivation of user", () => {
  it("then it should redirect to view user profile", async () => {
    await postConfirmDeactivate(req, res);

    expect(rejectOpenOrganisationRequestsForUser).not.toHaveBeenCalled();
    expect(rejectOpenUserServiceRequestsForUser).not.toHaveBeenCalled();
    expect(removeAllServicesForUser).not.toHaveBeenCalled();
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("then it should deactivate user record in directories", async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      "915a7382-576b-4699-ad07-a9fd329d3867",
    );
    expect(deactivate.mock.calls[0][1]).toBe("some reason for deactivation");
    expect(deactivate.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should update user in search index", async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Rupert Grint",
      email: "rupert.grint@hogwarts.test",
      organisationName: "Hogwarts School of Witchcraft and Wizardry",
      lastLogin: null,
      status: {
        id: 0,
        description: "Deactivated",
      },
    });
  });

  it("then it should should audit user being deactivated", async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-edit",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "915a7382-576b-4699-ad07-a9fd329d3867",
      editedFields: [
        {
          name: "status",
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason: "some reason for deactivation",
    });
  });
});

describe("When confirming deactivation of user given a reason from the select menu", () => {
  beforeEach(() => {
    req.body = {
      reason: "",
      "select-reason": "some selected reason for deactivation",
    };
  });

  it("then it should redirect to view user profile", async () => {
    await postConfirmDeactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("then it should deactivate user record in directories", async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      "915a7382-576b-4699-ad07-a9fd329d3867",
    );
    expect(deactivate.mock.calls[0][1]).toBe(
      "some selected reason for deactivation",
    );
    expect(deactivate.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should update user in search index", async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Rupert Grint",
      email: "rupert.grint@hogwarts.test",
      organisationName: "Hogwarts School of Witchcraft and Wizardry",
      lastLogin: null,
      status: {
        id: 0,
        description: "Deactivated",
      },
    });
  });

  it("then it should should audit user being deactivated", async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-edit",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "915a7382-576b-4699-ad07-a9fd329d3867",
      editedFields: [
        {
          name: "status",
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason: "some selected reason for deactivation",
    });
  });
});

describe("When confirming deactivation of user given a reason from the select menu and a text reason", () => {
  beforeEach(() => {
    req.body = {
      reason: "some text reason for deactivation",
      "select-reason": "some selected reason for deactivation",
    };
  });

  it("then it should redirect to view user profile", async () => {
    await postConfirmDeactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("then it should deactivate user record in directories", async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      "915a7382-576b-4699-ad07-a9fd329d3867",
    );
    expect(deactivate.mock.calls[0][1]).toBe(
      "some selected reason for deactivation - some text reason for deactivation",
    );
    expect(deactivate.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should update user in search index", async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Rupert Grint",
      email: "rupert.grint@hogwarts.test",
      organisationName: "Hogwarts School of Witchcraft and Wizardry",
      lastLogin: null,
      status: {
        id: 0,
        description: "Deactivated",
      },
    });
  });

  it("then it should audit user being deactivated", async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-edit",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "915a7382-576b-4699-ad07-a9fd329d3867",
      editedFields: [
        {
          name: "status",
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason:
        "some selected reason for deactivation - some text reason for deactivation",
    });
  });

  it("should render the page with an error if the reason is blank and the default dropdown option is selected", async () => {
    req.body = {
      reason: "",
      "select-reason": "Select a reason",
    };
    await postConfirmDeactivate(req, res);

    expect(sendResult.mock.calls).toHaveLength(1);
    expect(sendResult.mock.calls[0][3]).toMatchObject({
      csrfToken: "token",
      backLink: "services",
      reason: "",
      validationMessages: { reason: "Please give a reason for deactivation" },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });
});

it("should render the page with an error if the reason is over 1000 characters and the default dropdown option is selected", async () => {
  const longReason = "Test123456".repeat(110); // 1100 character length string.
  req.body = {
    reason: longReason,
    "select-reason": "Select a reason",
  };
  await postConfirmDeactivate(req, res);

  expect(sendResult.mock.calls).toHaveLength(1);
  expect(sendResult.mock.calls[0][3]).toMatchObject({
    csrfToken: "token",
    backLink: "services",
    reason: longReason,
    validationMessages: {
      reason: "Reason cannot be longer than 1000 characters",
    },
  });
  expect(res.redirect.mock.calls).toHaveLength(0);
});

it("should render the page with an error if the reason is over 1000 characters and a non-default dropdown option is selected", async () => {
  // Combined length of `${dropdownReason} - ${textReason}` cannot be more than 1k charaters
  const longReason = "Test123456".repeat(99); // 990 character length string.
  req.body = {
    reason: longReason,
    "select-reason": "Generic email",
  };
  await postConfirmDeactivate(req, res);

  expect(sendResult.mock.calls).toHaveLength(1);
  expect(sendResult.mock.calls[0][3]).toMatchObject({
    csrfToken: "token",
    backLink: "services",
    reason: longReason,
    validationMessages: {
      reason: "Reason cannot be longer than 1000 characters",
    },
  });
  expect(res.redirect.mock.calls).toHaveLength(0);
});

describe("When the remove all services and requests checkbox is ticked", () => {
  beforeEach(() => {
    req.body = {
      "remove-services-and-requests": "remove-services-and-requests",
      "select-reason": "some selected reason for deactivation",
      reason: "some text reason for deactivation",
    };
  });

  it("then it should redirect to view user profile on the happy path", async () => {
    await postConfirmDeactivate(req, res);

    expect(rejectOpenOrganisationRequestsForUser).toHaveBeenCalledWith(
      userId,
      req,
    );
    expect(rejectOpenUserServiceRequestsForUser).toHaveBeenCalledWith(
      userId,
      req,
    );
    expect(removeAllServicesForUser).toHaveBeenCalledWith(userId, req);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should not call updateUserServiceRequest when getUserServiceRequestsByUserId returns an empty array", async () => {
    getUserServiceRequestsByUserId.mockReset().mockReturnValue([]);
    await postConfirmDeactivate(req, res);
    expect(updateUserServiceRequest.mock.calls).toMatchObject([]);
  });

  it("should continue to work when getUserServiceRequestsByUserId returns undefined on a 404", async () => {
    // Returns undefined if the api call returns 404
    getUserServiceRequestsByUserId.mockReset().mockReturnValue(undefined);
    await postConfirmDeactivate(req, res);
    expect(updateUserServiceRequest.mock.calls).toMatchObject([]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should not call updateRequestById when getPendingRequestsAssociatedWithUser returns an empty array", async () => {
    getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue([]);
    await postConfirmDeactivate(req, res);
    expect(updateRequestById.mock.calls).toMatchObject([]);
  });

  it("should continue to work when getPendingRequestsAssociatedWithUser returns null on a 404 or 401", async () => {
    getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue(null);
    await postConfirmDeactivate(req, res);
    expect(updateRequestById.mock.calls).toMatchObject([]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should not call removeServiceFromUser when getServicesByUserId returns an empty array", async () => {
    getServicesByUserId.mockReset().mockReturnValue([]);
    await postConfirmDeactivate(req, res);
    expect(removeServiceFromUser.mock.calls).toMatchObject([]);
  });

  it("should continue to work getServicesByUserId returns undefined on a 404", async () => {
    getServicesByUserId.mockReset().mockReturnValue(undefined);
    await postConfirmDeactivate(req, res);
    expect(removeServiceFromUser.mock.calls).toMatchObject([]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });
});
