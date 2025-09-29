jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");
jest.mock("login.dfe.api-client/invitations");

const {
  deleteServiceAccessFromInvitation,
} = require("login.dfe.api-client/invitations");
const {
  removeAllServicesForInvitedUser,
} = require("../../../src/app/users/utils");
const {
  getInvitationServicesRaw,
} = require("login.dfe.api-client/invitations");

describe("When removing all services for an invited user", () => {
  const userId = "inv-user-id";
  let req;

  beforeEach(() => {
    getInvitationServicesRaw.mockReset().mockReturnValue([
      {
        userId: "inv-user-id",
        invitationId: "invitation-id",
        serviceId: "service-id",
        organisationId: "organisation-id",
        roles: ["role1"],
        identifiers: [{ key: "some", value: "thing" }],
      },
    ]);
    // Returns 204 on success
    deleteServiceAccessFromInvitation.mockReset().mockReturnValue(undefined);

    req = {
      id: "correlation-id",
    };
  });

  it("then it should call deleteServiceAccessFromInvitation when a service is returned", async () => {
    await removeAllServicesForInvitedUser(userId, req);

    expect(getInvitationServicesRaw.mock.calls).toHaveLength(1);
    expect(getInvitationServicesRaw).toHaveBeenCalledWith({
      userInvitationId: "user-id",
    });
    expect(deleteServiceAccessFromInvitation.mock.calls).toHaveLength(1);
  });

  it("should continue to work when getInvitationServicesRaw returns undefined on a 404", async () => {
    getInvitationServicesRaw.mockReset().mockReturnValue(undefined);
    await removeAllServicesForInvitedUser(userId, req);

    expect(getInvitationServicesRaw.mock.calls).toHaveLength(1);
    expect(getInvitationServicesRaw).toHaveBeenCalledWith({
      userInvitationId: "user-id",
    });
    expect(deleteServiceAccessFromInvitation.mock.calls).toHaveLength(0);
  });
});
