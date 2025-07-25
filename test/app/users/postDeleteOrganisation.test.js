jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");
jest.mock("./../../../src/infrastructure/organisations", () => ({
  deleteInvitationOrganisation: jest.fn(),
  deleteUserOrganisation: jest.fn(),
  getUserOrganisations: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/search", () => {
  return {
    getSearchDetailsForUserById: jest.fn(),
    updateIndex: jest.fn(),
    getById: jest.fn(),
  };
});

jest.mock("./../../../src/app/users/utils");

jest.mock("login.dfe.jobs-client");
const { NotificationClient } = require("login.dfe.jobs-client");
const { getRequestMock, getResponseMock } = require("../../utils");
const { getAllServicesForUserInOrg } = require("../../../src/app/users/utils");
const postDeleteOrganisation = require("../../../src/app/users/postDeleteOrganisation");
const {
  deleteInvitationOrganisation,
  deleteUserOrganisation,
  getUserOrganisations,
} = require("../../../src/infrastructure/organisations");
const {
  getSearchDetailsForUserById,
  getById,
} = require("../../../src/infrastructure/search");
const {
  removeServiceFromInvitation,
} = require("../../../src/infrastructure/access");

const res = getResponseMock();

describe("when removing a users access to an organisation", () => {
  let req;
  const expectedEmailAddress = "logan@x-men.test";
  const expectedFirstName = "James";
  const expectedLastName = "Howlett";
  const expectedOrgName = "X-Men";
  const sendUserRemovedFromOrganisationStub = jest.fn();

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
    getById.mockReset();
    getById.mockReturnValue({
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
    getUserOrganisations.mockReturnValue([
      {
        numericIdentifier: "1111",
        textIdentifier: "rpssss",
        organisation: { id: "test-org-id" },
      },
    ]);

    removeServiceFromInvitation.mockReset();

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
  });

  it("then it should delete org for invitation if request for invitation", async () => {
    req.params.uid = "inv-invite1";

    await postDeleteOrganisation(req, res);
    await getUserOrganisations.mockReset();

    expect(deleteInvitationOrganisation.mock.calls).toHaveLength(1);
    expect(deleteInvitationOrganisation.mock.calls[0][0]).toBe("invite1");
    expect(deleteInvitationOrganisation.mock.calls[0][1]).toBe("org1");
  });

  it("then it should delete org for user", async () => {
    await postDeleteOrganisation(req, res);

    expect(deleteUserOrganisation.mock.calls).toHaveLength(1);
    expect(deleteUserOrganisation.mock.calls[0][0]).toBe("user1");
    expect(deleteUserOrganisation.mock.calls[0][1]).toBe("org1");
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
    getById.mockReset();
    getById.mockReturnValue({
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
    expect(deleteUserOrganisation.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls).toHaveLength(1);
  });
});
