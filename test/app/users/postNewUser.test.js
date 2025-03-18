jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/directories");

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getUser } = require("./../../../src/infrastructure/directories");
const postNewUser = require("./../../../src/app/users/postNewUser");

const res = getResponseMock();

describe("When adding new users personal details", () => {
  let req;

  beforeEach(() => {
    getUser.mockReset().mockReturnValue(null);

    req = getRequestMock({
      body: {
        firstName: "James",
        lastName: "Howlett",
        email: "logan@x-men.test",
      },
    });

    res.mockResetAll();
  });

  it("then it should add user details to session", async () => {
    await postNewUser(req, res);

    expect(req.session.user).not.toBeNull();
    expect(req.session.user.firstName).toBe("James");
    expect(req.session.user.lastName).toBe("Howlett");
    expect(req.session.user.email).toBe("logan@x-men.test");
  });

  it("then it should overwrite user personal details and leave other user details if already there", async () => {
    const organisation = {
      id: "org1",
    };
    req.session.user = {
      organisation,
    };

    await postNewUser(req, res);

    expect(req.session.user).not.toBeNull();
    expect(req.session.user.firstName).toBe("James");
    expect(req.session.user.lastName).toBe("Howlett");
    expect(req.session.user.email).toBe("logan@x-men.test");
    expect(req.session.user.organisation).toBe(organisation);
  });

  it("then it should redirect to associate organisations view", async () => {
    await postNewUser(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("associate-organisation");
  });

  it("then it should render view if first name not entered", async () => {
    req.body.firstName = undefined;

    await postNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/newUser");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      backLink: "/users",
      layout: "sharedViews/layoutNew.ejs",
      firstName: "",
      lastName: "Howlett",
      email: "logan@x-men.test",
      validationMessages: {
        firstName: "Please enter a first name",
      },
    });
  });

  it("then it should render view if last name not entered", async () => {
    req.body.lastName = undefined;

    await postNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/newUser");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      firstName: "James",
      backLink: "/users",
      layout: "sharedViews/layoutNew.ejs",
      lastName: "",
      email: "logan@x-men.test",
      validationMessages: {
        lastName: "Please enter a last name",
      },
    });
  });

  it("then it should render view if email not entered", async () => {
    req.body.email = undefined;

    await postNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/newUser");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      backLink: "/users",
      layout: "sharedViews/layoutNew.ejs",
      firstName: "James",
      lastName: "Howlett",
      email: "",
      validationMessages: {
        email: "Please enter an email address",
      },
    });
  });

  it("then it should render view if email not valid", async () => {
    req.body.email = "not-an-email-address";

    await postNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/newUser");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      backLink: "/users",
      layout: "sharedViews/layoutNew.ejs",
      firstName: "James",
      lastName: "Howlett",
      email: "not-an-email-address",
      validationMessages: {
        email: "Please enter a valid email address",
      },
    });
  });

  it("then it should render view if email already associated to a user", async () => {
    getUser.mockReturnValue({});

    await postNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/newUser");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      backLink: "/users",
      layout: "sharedViews/layoutNew.ejs",
      firstName: "James",
      lastName: "Howlett",
      email: "logan@x-men.test",
      validationMessages: {
        email: "A DfE Sign-in user already exists with that email address",
      },
    });
  });
});
