jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/utils");

const { sendResult } = require("../../../src/infrastructure/utils");
const { getUserDetails } = require("../../../src/app/users/utils");
const getEditProfile = require("../../../src/app/users/getEditProfile");

describe("when getting user profile page", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      user: {
        sub: "user1",
        email: "super.user@unit.test",
      },
      params: {
        uid: "user1",
      },
      session: {},
    };

    res = {
      render: jest.fn(),
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });
    sendResult.mockReset();
  });

  it("then it should get user profile", async () => {
    await getEditProfile(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "users/views/editProfile",
      {
        csrfToken: req.csrfToken(),
        layout: "sharedViews/layoutNew.ejs",
        currentPage: "users",
        backLink: "services",
        user: {
          id: "user1",
        },
        validationMessages: {},
      },
    );
  });
});
