const { getRequestMock, getResponseMock } = require("./../../utils");
const postOrganisationPermissions = require("./../../../src/app/users/postOrganisationPermissions");

const res = getResponseMock();

describe("when associating user to organisations", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        selectedLevel: 0,
      },
      session: {
        user: {
          firstName: "James",
          lastName: "Howlett",
          email: "logan@x-men.test",
          organisationId: "org1",
          organisationName: "X-Men",
        },
      },
    });

    res.mockResetAll();
  });

  it("then it should add user permissions to session", async () => {
    await postOrganisationPermissions(req, res);

    expect(req.session.user.permission).toBe(0);
  });

  it("then it should redirect to confirm new user", async () => {
    await postOrganisationPermissions(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-new-user");
  });

  it("then it should render view with error is no level selected", async () => {
    req.body.selectedLevel = undefined;

    await postOrganisationPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/organisationPermissions",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      currentPage: "users",
      userFullName: "James Howlett",
      organisationName: "X-Men",
      selectedLevel: undefined,
      validationMessages: {
        selectedLevel: "Please select a permission level",
      },
    });
  });

  it("then it should render view with error is selected level is invalid", async () => {
    req.body.selectedLevel = 999999999;

    await postOrganisationPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/organisationPermissions",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      currentPage: "users",
      userFullName: "James Howlett",
      organisationName: "X-Men",
      selectedLevel: 999999999,
      validationMessages: {
        selectedLevel: "Please select a permission level",
      },
    });
  });
});
