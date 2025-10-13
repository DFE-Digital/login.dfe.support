jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/search");
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/users");

const { getRequestMock, getResponseMock } = require("./../../utils");
const postEditPermissions = require("./../../../src/app/users/postEditPermissions");
const {
  getSearchDetailsForUserById,
} = require("./../../../src/infrastructure/search");

const {
  addOrganisationToUser,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");

jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/services");
const { NotificationClient } = require("login.dfe.jobs-client");
const {
  addOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");

const res = getResponseMock();

describe("when editing a users permission level", () => {
  let req;
  let sendUserPermissionChangedStub;

  const expectedEmailAddress = "logan@x-men.test";
  const expectedFirstName = "James";
  const expectedLastName = "Howlett";
  const expectedOrgName = "X-Men";
  const expectedPermission = [
    {
      id: 10000,
      name: "Approver",
      oldName: "End user",
    },
    {
      id: 0,
      name: "End user",
      oldName: "Approver",
    },
  ];

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        id: "org1",
      },
      body: {
        selectedLevel: 0,
      },
      session: {
        user: {
          firstName: "James",
          lastName: "Howlett",
          email: "logan@x-men.test",
        },
        org: {
          organisationId: "org1",
          name: "X-Men",
        },
      },
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
    getUserOrganisationsWithServicesRaw.mockReset().mockReturnValue([
      {
        organisation: {
          id: "org1",
          name: "Great Big School",
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
    ]);
    sendUserPermissionChangedStub = jest.fn();
    NotificationClient.mockReset().mockImplementation(() => ({
      sendUserPermissionChanged: sendUserPermissionChangedStub,
    }));
  });

  it("then it should edit org permission for invitation if request for invitation", async () => {
    req.params.uid = "inv-user1";

    await postEditPermissions(req, res);

    expect(addOrganisationToInvitation.mock.calls).toHaveLength(1);
    expect(addOrganisationToInvitation).toHaveBeenCalledWith({
      invitationId: "user1",
      organisationId: "org1",
      roleId: 0,
    });
  });

  it("then it should edit org permission for user", async () => {
    await postEditPermissions(req, res);

    expect(addOrganisationToUser.mock.calls).toHaveLength(1);
    expect(addOrganisationToUser).toHaveBeenCalledWith({
      organisationId: "org1",
      roleId: 0,
      userId: "user1",
    });
  });

  it("then it should redirect to organisations", async () => {
    await postEditPermissions(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should display error if no level is selected", async () => {
    req.body.selectedLevel = undefined;

    await postEditPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editPermissions");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      userFullName: "James Howlett",
      selectedLevel: undefined,
      organisationName: "X-Men",
      validationMessages: {
        selectedLevel: "Please select a permission level",
      },
    });
  });

  it("then it should display error if invalid level", async () => {
    req.body.selectedLevel = 999999;

    await postEditPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editPermissions");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      userFullName: "James Howlett",
      organisationName: "X-Men",
      selectedLevel: 999999,
      validationMessages: {
        selectedLevel: "Please select a permission level",
      },
    });
  });

  it("then it should send an email notification if user permissions are modified to approver", async () => {
    req.body.selectedLevel = 10000;

    await postEditPermissions(req, res);

    expect(sendUserPermissionChangedStub.mock.calls).toHaveLength(1);
    expect(sendUserPermissionChangedStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][1]).toBe(
      expectedFirstName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][2]).toBe(
      expectedLastName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][3]).toBe(
      expectedOrgName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][4]).toEqual(
      expectedPermission[0],
    );
  });

  it("then it should send an email notification if user permissions are modified to end user", async () => {
    req.body.selectedLevel = 0;
    getUserOrganisationsWithServicesRaw.mockReset().mockReturnValue([
      {
        organisation: {
          id: "org1",
          name: "Great Big School",
        },
        role: {
          id: 10000,
          name: "Approver",
        },
      },
    ]);

    await postEditPermissions(req, res);

    expect(sendUserPermissionChangedStub.mock.calls).toHaveLength(1);
    expect(sendUserPermissionChangedStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][1]).toBe(
      expectedFirstName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][2]).toBe(
      expectedLastName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][3]).toBe(
      expectedOrgName,
    );
    expect(sendUserPermissionChangedStub.mock.calls[0][4]).toEqual(
      expectedPermission[1],
    );
  });
});
