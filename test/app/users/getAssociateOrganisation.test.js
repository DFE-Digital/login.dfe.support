jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({}),
);

const { getRequestMock } = require("../../utils");
const getAssociateOrganisation = require("../../../src/app/users/getAssociateOrganisation");

describe("When calling the getAssociateOrganisation function", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        user: {
          email: "test@education.gov.uk",
          firstName: "Test",
          lastName: "User",
        },
        save: jest.fn((cb) => cb()),
      },
    });

    res = {
      render: jest.fn(),
      flash: jest.fn(),
    };
  });

  it("renders users/views/associateOrganisation on success", async () => {
    await getAssociateOrganisation(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/associateOrganisation",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
      criteria: "",
      results: undefined,
      page: 1,
      numberOfPages: 1,
      numberOfResults: 1,
      firstRecordNumber: 1,
      lastRecordNumber: 1,
      canSkip: true,
    });

    expect(req.session).toMatchObject({
      user: {
        email: "test@education.gov.uk",
        firstName: "Test",
        lastName: "User",
      },
    });
  });

  it("deletes organisation and permission data if present", async () => {
    ((req.session.user = {
      email: "test@education.gov.uk",
      firstName: "Test",
      lastName: "User",
      organisationName: "Test org",
      organisationId: "Test id",
      permission: "Test permission",
    }),
      await getAssociateOrganisation(req, res));

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/associateOrganisation",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
      criteria: "",
      results: undefined,
      page: 1,
      numberOfPages: 1,
      numberOfResults: 1,
      firstRecordNumber: 1,
      lastRecordNumber: 1,
      canSkip: true,
    });

    expect(req.session).toMatchObject({
      user: {
        email: "test@education.gov.uk",
        firstName: "Test",
        lastName: "User",
      },
    });
  });

  it("renders the page with an error if an error occurs during the session.save", async () => {
    const testReq = getRequestMock({
      session: {
        user: {
          email: "test@education.gov.uk",
          firstName: "Test",
          lastName: "User",
        },
        save: jest.fn((cb) => cb("Something went wrong")),
      },
    });

    await getAssociateOrganisation(testReq, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/associateOrganisation",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
      criteria: "",
      results: undefined,
      page: 1,
      numberOfPages: 1,
      numberOfResults: 1,
      firstRecordNumber: 1,
      lastRecordNumber: 1,
      canSkip: true,
    });
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      "Failed to clear invited user organisation details",
    );
  });
});
