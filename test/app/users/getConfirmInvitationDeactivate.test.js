const get = require("./../../../src/app/users/getConfirmInvitationDeactivate");

describe("When processing a get for a user invitation deactivate request", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: "GET",
      params: {
        uid: "123-456-789",
      },
      csrfToken: () => {
        return "token";
      },
      accepts: () => {
        return ["text/html"];
      },
    };

    res = {
      render: jest.fn(),
    };
  });

  test("then it should render the userDevice view", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "users/views/confirmInvitationDeactivate",
    );
  });

  test("then it should include csrf token", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });
});
