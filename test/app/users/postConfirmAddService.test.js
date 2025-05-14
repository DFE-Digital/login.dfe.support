jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/applications", () => {
  return {
    getAllServices: jest.fn(),
    isSupportEmailNotificationAllowed: jest.fn(),
  };
});
jest.mock("./../../../src/infrastructure/access", () => {
  return {
    listRolesOfService: jest.fn(),
    addInvitationService: jest.fn(),
    addUserService: jest.fn(),
    updateUserService: jest.fn(),
    updateInvitationService: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  listRolesOfService,
  addUserService,
  addInvitationService,
  updateInvitationService,
  updateUserService,
} = require("./../../../src/infrastructure/access");
const {
  getAllServices,
  isSupportEmailNotificationAllowed,
} = require("./../../../src/infrastructure/applications");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../../src/infrastructure/organisations");

const logger = require("./../../../src/infrastructure/logger");

jest.mock("login.dfe.jobs-client");
const { NotificationClient } = require("login.dfe.jobs-client");
const res = getResponseMock();

describe("when adding new services to a user", () => {
  let req;
  let postConfirmAddService;
  let sendServiceAddedStub;
  let sendServiceRequestApprovedStub;

  const expectedEmailAddress = "test@test.com";
  const expectedFirstName = "test";
  const expectedLastName = "name";
  const expectedService = "Services";
  const expectedOrgName = "Great Big School";
  const expectedServiceName = "service name";
  const expectedRoles = [];
  const expectedPermission = {
    id: 0,
    name: "End user",
  };

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        orgId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        sid: "service1",
      },
      session: {
        user: {
          email: "test@test.com",
          firstName: "test",
          lastName: "name",
          services: [
            {
              serviceId: "service1",
              name: "service1",
              roles: [],
            },
          ],
        },
      },
    });
    res.mockResetAll();
    addInvitationService.mockReset();
    addUserService.mockReset();
    postConfirmAddService =
      require("./../../../src/app/users/confirmAddService").post;

    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "service1",
          dateActivated: "10/10/2018",
          name: "service name",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
    });

    isSupportEmailNotificationAllowed.mockReset();
    isSupportEmailNotificationAllowed.mockReturnValue({
      type: "email",
      serviceName: "support",
      flag: 1,
    });

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        role: {
          id: 10000,
          name: "Approver",
        },
      },
    ]);

    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        invitationId: "E89DF8C6-BED4-480D-9F02-34D177E86DAD",
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
      {
        invitationId: "E89DF8C6-BED4-480D-9F02-34D177E86DAD",
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        role: {
          id: 10000,
          name: "Approver",
        },
      },
    ]);

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([
      {
        code: "role_code",
        id: "role_id",
        name: "role_name",
        status: {
          id: "status_id",
        },
      },
    ]);

    sendServiceAddedStub = jest.fn();
    sendServiceRequestApprovedStub = jest.fn();

    NotificationClient.mockReset().mockImplementation(() => ({
      sendServiceRequestApproved: sendServiceRequestApprovedStub,
      sendServiceAdded: sendServiceAddedStub,
    }));
  });

  it("then it should redirect to user details if no user in session", async () => {
    req.session.user = null;
    await postConfirmAddService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should add services to invitation for organisation if req for invitation", async () => {
    req.session.user.isAddService = true;
    req.params.uid = "inv-invite1";
    await postConfirmAddService(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe("invite1");
    expect(addInvitationService.mock.calls[0][1]).toBe("service1");
    expect(addInvitationService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(addInvitationService.mock.calls[0][3]).toEqual([]);
    expect(addInvitationService.mock.calls[0][4]).toEqual([]);
    expect(addInvitationService.mock.calls[0][5]).toBe("correlationId");
  });

  it("then it should add services to user if req for user", async () => {
    req.session.user.isAddService = true;
    req.params.uid = "user1";
    await postConfirmAddService(req, res);

    expect(addUserService.mock.calls).toHaveLength(1);
    expect(addUserService.mock.calls[0][0]).toBe("user1");
    expect(addUserService.mock.calls[0][1]).toBe("service1");
    expect(addUserService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(addUserService.mock.calls[0][3]).toEqual([]);
    expect(addUserService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should update services for user if req for user", async () => {
    req.params.uid = "user1";
    await postConfirmAddService(req, res);

    expect(updateUserService.mock.calls).toHaveLength(1);
    expect(updateUserService.mock.calls[0][0]).toBe("user1");
    expect(updateUserService.mock.calls[0][1]).toBe("service1");
    expect(updateUserService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(updateUserService.mock.calls[0][3]).toEqual([]);
    expect(updateUserService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should update services for invitation for organisation if req for invitation", async () => {
    req.params.uid = "inv-invite1";
    await postConfirmAddService(req, res);

    expect(updateInvitationService.mock.calls).toHaveLength(1);
    expect(updateInvitationService.mock.calls[0][0]).toBe("invite1");
    expect(updateInvitationService.mock.calls[0][1]).toBe("service1");
    expect(updateInvitationService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(updateInvitationService.mock.calls[0][3]).toEqual([]);
    expect(updateInvitationService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should should audit adding services to an existing user if isAddService is true", async () => {
    req.session.user.isAddService = true;
    await postConfirmAddService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test added 1 service(s) for user test@test.com",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-services-added",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: req.params.uid,
      editedFields: [
        {
          name: "add_services",
          newValue: req.session.user.services,
        },
      ],
    });
  });

  it("then it should should audit editing a service if isAddService is false", async () => {
    await postConfirmAddService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test updated service service1 for user test@test.com",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-service-updated",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: req.params.uid,
      editedFields: [
        {
          name: "update_service",
          newValue: req.session.user.services,
        },
      ],
    });
  });

  it("then it should redirect to services tab", async () => {
    await postConfirmAddService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/services`,
    );
  });

  it("then a flash message is displayed showing services have been added if isAddService is true", async () => {
    req.session.user.isAddService = true;
    await postConfirmAddService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      `${expectedService} successfully added`,
    );
  });

  it("then a flash message is displayed showing service has been edited if isAddService is false", async () => {
    await postConfirmAddService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      `${req.session.user.services[0].name} updated successfully`,
    );
  });

  it("then it should send an email notification to user", async () => {
    await postConfirmAddService(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe("service1");
    expect(listRolesOfService.mock.calls[0][1]).toBe("correlationId");

    expect(sendServiceRequestApprovedStub.mock.calls).toHaveLength(1);
    expect(sendServiceRequestApprovedStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][1]).toBe(
      expectedFirstName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][2]).toBe(
      expectedLastName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][3]).toBe(
      expectedOrgName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][4]).toBe(
      expectedServiceName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][5]).toEqual(
      expectedRoles,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][6]).toEqual(
      expectedPermission,
    );
  });
});
