jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock(
  "../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById",
);
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/services");
jest.mock("login.dfe.jobs-client");

const {
  NotificationClient,
  ServiceNotificationsClient,
} = require("login.dfe.jobs-client");
const { getRequestMock, getResponseMock } = require("../../utils");
const { getAllServicesForUserInOrg } = require("../../../src/app/users/utils");
const postDeleteOrganisation = require("../../../src/app/users/postDeleteOrganisation");

const {
  getSearchDetailsForUserById,
} = require("../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById");
const { searchUserByIdRaw } = require("login.dfe.api-client/users");
const {
  deleteServiceAccessFromInvitation,
  deleteOrganisationAccessFromInvitation,
} = require("login.dfe.api-client/invitations");
const {
  getUserOrganisationsWithServicesRaw,
  deleteUserOrganisationAccess,
} = require("login.dfe.api-client/users");

const res = getResponseMock();

describe("when removing a users access to an organisation", () => {
  let req;
  const expectedEmailAddress = "logan@x-men.test";
  const expectedFirstName = "James";
  const expectedLastName = "Howlett";
  const expectedOrgName = "X-Men";
  const sendUserRemovedFromOrganisationStub = jest.fn();
  let notifyUserUpdatedStub;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        id: "org1",
      },
      session: {
        user: {
          firstName: expectedFirstName,
          lastName: expectedLastName,
          email: expectedEmailAddress,
        },
        org: {
          organisationId: "org1",
          name: expectedOrgName,
        },
      },
    });
    searchUserByIdRaw.mockReset();
    searchUserByIdRaw.mockReturnValue({
      organisations: [
        {
          id: "org1",
          name: expectedOrgName,
          categoryId: "004",
          statusId: 1,
          roleId: 0,
        },
      ],
      statusId: 1,
    });
    res.mockResetAll();
    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [
        {
          id: "org1",
          name: "organisationId",
          categoryId: "004",
          statusId: 1,
          roleId: 0,
        },
      ],
    });
    getUserOrganisationsWithServicesRaw.mockReturnValue([
      {
        numericIdentifier: "1111",
        textIdentifier: "rpssss",
        organisation: { id: "test-org-id" },
      },
    ]);

    deleteServiceAccessFromInvitation.mockReset();

    getAllServicesForUserInOrg.mockReset().mockReturnValue([
      {
        id: "service2",
        dateActivated: "10/10/2018",
        name: "service name",
        status: "active",
        isExternalService: true,
      },
    ]);

    NotificationClient.mockReset().mockImplementation(() => ({
      sendUserRemovedFromOrganisation: sendUserRemovedFromOrganisationStub,
    }));

    notifyUserUpdatedStub = jest.fn().mockResolvedValue(undefined);
    ServiceNotificationsClient.mockReset().mockImplementation(() => ({
      notifyUserUpdated: notifyUserUpdatedStub,
    }));
  });

  it("then it should delete org for invitation if request for invitation", async () => {
    req.params.uid = "inv-invite1";

    await postDeleteOrganisation(req, res);
    await getUserOrganisationsWithServicesRaw.mockReset();

    expect(deleteOrganisationAccessFromInvitation.mock.calls).toHaveLength(1);
    expect(deleteOrganisationAccessFromInvitation).toHaveBeenCalledWith({
      organisationId: "org1",
      invitationId: "invite1",
    });
  });

  it("then it should delete org for user", async () => {
    await postDeleteOrganisation(req, res);

    expect(deleteUserOrganisationAccess.mock.calls).toHaveLength(1);
    expect(deleteUserOrganisationAccess).toHaveBeenCalledWith({
      organisationId: "org1",
      userId: "user1",
    });
  });

  it("then it should send a WS sync notification for each service removed from the user's org", async () => {
    await postDeleteOrganisation(req, res);

    expect(notifyUserUpdatedStub.mock.calls).toHaveLength(1);
    expect(notifyUserUpdatedStub).toHaveBeenCalledWith({
      sub: "user1",
      removedServiceId: "service2",
      removedOrgId: "org1",
    });
  });

  it("then it should log, flash a warning, and continue if the WS sync notification fails", async () => {
    notifyUserUpdatedStub.mockRejectedValueOnce(new Error("sync failed"));

    await expect(postDeleteOrganisation(req, res)).resolves.not.toThrow();

    expect(deleteUserOrganisationAccess.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.flash).toHaveBeenCalledWith(
      "warning",
      "Sync notification to legacy WS service failed. You can retry from 'Sync user' page.",
    );
    expect(res.flash).toHaveBeenCalledWith(
      "info",
      `${expectedFirstName} ${expectedLastName} no longer has access to ${expectedOrgName}`,
    );
  });

  it("then it should redirect to organisations", async () => {
    await postDeleteOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should send an email notification to user", async () => {
    await postDeleteOrganisation(req, res);

    expect(sendUserRemovedFromOrganisationStub.mock.calls).toHaveLength(1);

    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][1]).toBe(
      expectedFirstName,
    );
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][2]).toBe(
      expectedLastName,
    );
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][3]).toBe(
      expectedOrgName,
    );
  });

  it("then it should not send an email notification to deactivated user", async () => {
    searchUserByIdRaw.mockReset();
    searchUserByIdRaw.mockReturnValue({
      organisations: [
        {
          id: "org1",
          name: "organisationName",
          categoryId: "004",
          statusId: 1,
          roleId: 0,
        },
      ],
      statusId: 0,
    });

    await postDeleteOrganisation(req, res);

    expect(sendUserRemovedFromOrganisationStub.mock.calls).toHaveLength(0);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(deleteUserOrganisationAccess.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls).toHaveLength(1);
  });
});
