jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);

jest.mock("./../../../src/infrastructure/organisations");
const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  getUserOrganisationsV2,
} = require("./../../../src/infrastructure/organisations");
const res = getResponseMock();

describe("when selecting an organisation", () => {
  let req;

  let postMultipleOrgSelection;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        orgId: "organisationId",
      },
      session: {},
      body: {
        selectedOrganisation: "organisationId",
      },
    });
    res.mockResetAll();

    getUserOrganisationsV2.mockReset();
    getUserOrganisationsV2.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
      },
    ]);

    postMultipleOrgSelection =
      require("./../../../src/app/users/selectOrganisation").post;
  });

  it("then it should redirect to the selected organisation", async () => {
    await postMultipleOrgSelection(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations/${req.params.orgId}`,
    );
  });

  it("then it should render validation message if no selected organisation", async () => {
    req.body.selectedOrganisation = undefined;

    await postMultipleOrgSelection(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`users/views/selectOrganisation`);
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      selectedOrganisation: undefined,
      organisations: [
        {
          naturalIdentifiers: [],
          organisation: {
            id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
            name: "Great Big School",
          },
        },
        {
          naturalIdentifiers: [],
          organisation: {
            id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
            name: "Little Tiny School",
          },
        },
      ],
      validationMessages: {
        selectedOrganisation: "Please select an organisation",
      },
    });
  });
});
