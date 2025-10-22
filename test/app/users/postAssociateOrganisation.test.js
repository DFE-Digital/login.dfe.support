jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("./../../utils");
const postAssociateOrganisation = require("./../../../src/app/users/postAssociateOrganisation");
const {
  getOrganisationLegacyRaw,
  searchOrganisationsRaw,
  getOrganisationCategories,
} = require("login.dfe.api-client/organisations");

const res = getResponseMock();

describe("when associating user to organisations", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        criteria: "something",
        page: 1,
      },
      session: {
        user: {
          firstName: "James",
          lastName: "Howlett",
          email: "logan@x-men.test",
        },
      },
      method: "POST",
    });

    res.mockResetAll();

    searchOrganisationsRaw.mockReset().mockReturnValue({
      organisations: [{ id: "org1" }],
      totalNumberOfPages: 2,
      totalNumberOfRecords: 49,
    });

    getOrganisationLegacyRaw.mockReset().mockReturnValue({
      id: "org1",
      name: "Organisation One",
    });

    getOrganisationCategories.mockReset().mockReturnValue([
      {
        id: "001",
      },
    ]);
  });

  it("then it should return search results for organisations", async () => {
    await postAssociateOrganisation(req, res);

    expect(searchOrganisationsRaw.mock.calls).toHaveLength(1);
    expect(searchOrganisationsRaw).toHaveBeenCalledWith({
      categories: ["001"],
      organisationName: "something",
      pageNumber: 1,
    });

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/associateOrganisation",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      layout: "sharedViews/layout.ejs",
      csrfToken: "token",
      criteria: "something",
      results: [{ id: "org1" }],
      page: 1,
      numberOfPages: 2,
      numberOfResults: 49,
      canSkip: true,
    });
  });

  it("then it should update new user in session if organisation is selected", async () => {
    req.body = {
      selectedOrganisation: "org1",
    };

    await postAssociateOrganisation(req, res);

    expect(req.session.user.organisationId).toBe("org1");
    expect(req.session.user.organisationName).toBe("Organisation One");
  });

  it("then it should redirect to organisation permissions if organisation is selected", async () => {
    req.body = {
      selectedOrganisation: "org1",
    };

    await postAssociateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("organisation-permissions");

    expect(searchOrganisationsRaw.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(0);
  });
});
