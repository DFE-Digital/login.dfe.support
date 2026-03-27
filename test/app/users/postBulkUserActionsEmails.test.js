jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({}),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/invitations");

const { getRequestMock } = require("../../utils");
const {
  getUserDetailsById,
  searchForBulkUsersPage,
} = require("../../../src/app/users/utils");
const postBulkUserActionsEmails = require("../../../src/app/users/postBulkUserActionsEmails");

describe("When processing a post for the bulk user actions emails request for users", () => {
  let req;
  let res;

  beforeEach(() => {
    const userSearchResult = [
      {
        id: "34080a9c-fd79-45a6-a092-4756264d5c85",
        name: "User One",
        email: "user.one@unit.test",
        organisation: {
          name: "Testing school",
        },
        lastLogin: null,
        status: {
          description: "Active",
        },
      },
    ];

    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "remove-services-and-requests": "remove-services-and-requests",
        "select-reason": "Security breach",
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
    };

    searchForBulkUsersPage.mockReset().mockReturnValue({
      users: userSearchResult,
    });
    getUserDetailsById.mockReset().mockReturnValue(userSearchResult);
  });

  it("redirects to the /users page on success when an user and an action is ticked", async () => {
    await postBulkUserActionsEmails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(req.session.emails).toBe("");
  });

  it("renders the page with an error when no users are ticked", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/bulkUserActionsEmails",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      validationMessages: { users: "At least 1 user needs to be ticked" },
    });
  });

  it("renders the page with no duplicate users when an error is rendered", async () => {
    // Search can return multiple results if there is an alias account for that user.
    // This test has 3 results come back in the search between the 2 emails, but the rendered
    // page should only have 2 results.
    const userSearchResultWithAliases = [
      {
        id: "34080a9c-fd79-45a6-a092-4756264d5c85",
        name: "User One",
        email: "user.one@unit.test",
        organisation: {
          name: "Testing school",
        },
        lastLogin: null,
        status: {
          description: "Active",
        },
      },
      {
        id: "34080a9c-fd79-45a6-a092-4756264d5c85",
        name: "User One",
        email: "user.one+1@unit.test",
        organisation: {
          name: "Testing school",
        },
        lastLogin: null,
        status: {
          description: "Active",
        },
      },
    ];

    const aliasUserSearchResult = [
      {
        id: "34080a9c-fd79-45a6-a092-4756264d5c85",
        name: "User One",
        email: "user.one+1@unit.test",
        organisation: {
          name: "Testing school",
        },
        lastLogin: null,
        status: {
          description: "Active",
        },
      },
    ];

    searchForBulkUsersPage
      .mockReset()
      .mockReturnValueOnce({
        users: userSearchResultWithAliases,
      })
      .mockReturnValueOnce({
        users: aliasUserSearchResult,
      });

    req = getRequestMock({
      session: {
        emails: "user.one@unit.test, user.one+1@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/bulkUserActionsEmails",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      validationMessages: { users: "At least 1 user needs to be ticked" },
      users: userSearchResultWithAliases,
    });
  });

  it("renders the page with an error when no actions are ticked", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "user-abc-123": "abc-123",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/bulkUserActionsEmails",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      validationMessages: { actions: "At least 1 action needs to be ticked" },
    });
  });

  it("renders the page with an error when deactivate is ticked but no reason is provided", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "select-reason": "Select a reason",
        reason: "",
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/bulkUserActionsEmails",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      validationMessages: { reason: "Please give a reason for deactivation" },
    });
  });

  it("renders the page with an error when reason exceeds 1000 characters", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "select-reason": "Select a reason",
        reason: "a".repeat(1001),
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/bulkUserActionsEmails",
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      validationMessages: {
        reason: "Reason cannot be longer than 1000 characters",
      },
    });
  });

  it("redirects to /users on success when deactivate is ticked with a typed reason", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "select-reason": "Select a reason",
        reason: "User requested deactivation",
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("redirects to /users on success when deactivate is ticked with a dropdown reason and additional text", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "select-reason": "Security breach",
        reason: "Additional context",
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("returns selectReason and reason values to the view on validation error", async () => {
    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "select-reason": "Select a reason",
        reason: "",
        "user-34080a9c-fd79-45a6-a092-4756264d5c85":
          "34080a9c-fd79-45a6-a092-4756264d5c85",
      },
    });
    await postBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      selectReason: "Select a reason",
      reason: "",
      deactivateUsersTicked: true,
    });
  });
});

describe("When processing a post for the bulk user actions emails request for invited users", () => {
  let req;
  let res;

  beforeEach(() => {
    const userSearchResult = [
      {
        id: "inv-9a44a8f1-572d-47dd-b12b-415d2f5aaa63",
        name: "User One",
        email: "user.one@unit.test",
        organisation: {
          name: "Testing school",
        },
        lastLogin: null,
        status: {
          description: "Invited",
        },
      },
    ];

    req = getRequestMock({
      session: {
        emails: "user.one@unit.test",
      },
      body: {
        "deactivate-users": "deactivate-users",
        "remove-services-and-requests": "remove-services-and-requests",
        "select-reason": "Security breach",
        "user-inv-9a44a8f1-572d-47dd-b12b-415d2f5aaa63":
          "inv-9a44a8f1-572d-47dd-b12b-415d2f5aaa63",
      },
    });

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
    };

    searchForBulkUsersPage.mockReset().mockReturnValue(userSearchResult);
    getUserDetailsById.mockReset().mockReturnValue({
      id: "inv-34080a9c-fd79-45a6-a092-4756264d5c85",
      status: { id: -1 },
    });
  });

  it("redirects to the /users page on success when an invited user is ticked", async () => {
    await postBulkUserActionsEmails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(req.session.emails).toBe("");
  });
});
