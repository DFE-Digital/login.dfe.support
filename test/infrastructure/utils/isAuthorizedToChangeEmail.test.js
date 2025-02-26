const isAuthorizedToChangeEmail = require("../../../src/infrastructure/utils/isAuthorizedToChangeEmail");
const Account = require("../../../src/infrastructure/directories");

jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);

jest.mock("../../../src/infrastructure/directories");

describe("isAuthorizedToChangeEmail middleware function", () => {
  let req, res, next;

  beforeEach(() => {
    jest.resetAllMocks();

    req = {
      params: {
        uid: "user-id",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    };
    next = jest.fn();

    Account.getUser.mockReset().mockResolvedValue({
      isInternalUser: false,
      isEntra: true,
      entraOid: "userEntraOid",
    });
  });

  it("should call next if user is authorized to change their email address or password", async () => {
    await isAuthorizedToChangeEmail(req, res, next);

    expect(Account.getUser).toHaveBeenCalledWith("user-id");
    expect(res.status).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if user is not present in the request", async () => {
    req.params = null;

    await isAuthorizedToChangeEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith("errors/views/notAuthorised");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if user is an internal DSI user which migrated to Entra", async () => {
    Account.getUser.mockReset().mockResolvedValue({
      isInternalUser: true,
      isEntra: true,
      entraOid: "userEntraOid",
    });

    await isAuthorizedToChangeEmail(req, res, next);

    expect(Account.getUser).toHaveBeenCalledWith("user-id");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith("errors/views/notAuthorised");
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next with error if an exception occurs", async () => {
    const error = new Error("it error");
    Account.getUser.mockRejectedValue(error);

    await isAuthorizedToChangeEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
