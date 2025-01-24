jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);

jest.mock("./../../../src/infrastructure/organisations");

jest.mock("./../../../src/infrastructure/applications", () => {
  return {
    getServiceById: jest.fn(),
    isSupportEmailNotificationAllowed: jest.fn(),
  };
});

jest.mock("./../../../src/infrastructure/access", () => {
  return {
    removeServiceFromUser: jest.fn(),
    removeServiceFromInvitation: jest.fn(),
  };
});

const logger = require("./../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  getServiceById,
  isSupportEmailNotificationAllowed,
} = require("./../../../src/infrastructure/applications");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../../src/infrastructure/organisations");
const {
  removeServiceFromInvitation,
  removeServiceFromUser,
} = require("./../../../src/infrastructure/access");

jest.mock("login.dfe.jobs-client");
const { NotificationClient } = require("login.dfe.jobs-client");

const res = getResponseMock();

describe("when removing access to a service", () => {
  let req;
  let postRemoveService;
  let organisationName = ["Great Big School", "Little Tiny School"];
  let sendUserServiceRemovedStub;

  const expectedEmailAddress = "test@test.com";
  const expectedFirstName = "test";
  const expectedLastName = "name";
  const expectedServiceName = "service name";

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
              roles: [],
            },
          ],
        },
      },
    });
    res.mockResetAll();

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: organisationName[0],
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: organisationName[1],
        },
      },
    ]);
    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: organisationName[0],
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: organisationName[1],
        },
      },
    ]);

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
      isExternalService: true,
    });

    isSupportEmailNotificationAllowed.mockReset();
    isSupportEmailNotificationAllowed.mockReturnValue({
      type: "email",
      serviceName: "support",
      flag: 1,
    });

    postRemoveService =
      require("./../../../src/app/users/removeServiceAccess").post;

    sendUserServiceRemovedStub = jest.fn();
    NotificationClient.mockReset().mockImplementation(() => ({
      sendUserServiceRemoved: sendUserServiceRemovedStub,
    }));
  });

  it("then it should redirect to user details if no user in session", async () => {
    req.session.user = undefined;
    await postRemoveService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should delete service for invitation if request for invitation", async () => {
    req.params.uid = "inv-invite1";

    await postRemoveService(req, res);

    expect(removeServiceFromInvitation.mock.calls).toHaveLength(1);
    expect(removeServiceFromInvitation.mock.calls[0][0]).toBe("invite1");
    expect(removeServiceFromInvitation.mock.calls[0][1]).toBe("service1");
    expect(removeServiceFromInvitation.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(removeServiceFromInvitation.mock.calls[0][3]).toBe("correlationId");
  });

  it("then it should delete org for user if request for user", async () => {
    await postRemoveService(req, res);

    expect(removeServiceFromUser.mock.calls).toHaveLength(1);
    expect(removeServiceFromUser.mock.calls[0][0]).toBe("user1");
    expect(removeServiceFromUser.mock.calls[0][1]).toBe("service1");
    expect(removeServiceFromUser.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(removeServiceFromUser.mock.calls[0][3]).toBe("correlationId");
  });

  it("then it should should audit service being removed", async () => {
    await postRemoveService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) removed service service name for organisation id: 88a1ed39-5a98-43da-b66e-78e564ea72b0) for user test@test.com (id: user1)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-service-deleted",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "user1",
      editedFields: [
        {
          name: "remove_service",
          oldValue: "service1",
          newValue: undefined,
        },
      ],
    });
  });

  it("then it should redirect to services tab", async () => {
    await postRemoveService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/services`,
    );
  });

  it("then a flash message is shown to the user", async () => {
    await postRemoveService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      `${expectedServiceName} successfully removed`,
    );
  });

  it("then it should send an email notification to user", async () => {
    await postRemoveService(req, res);

    expect(sendUserServiceRemovedStub.mock.calls).toHaveLength(1);

    expect(sendUserServiceRemovedStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendUserServiceRemovedStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendUserServiceRemovedStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendUserServiceRemovedStub.mock.calls[0][3]).toBe(
      expectedServiceName,
    );
    expect(sendUserServiceRemovedStub.mock.calls[0][4]).toBe(
      organisationName[0],
    );
  });
});
