const isAuthorizedToChangeEmail = require("../../../src/infrastructure/utils/isAuthorizedToChangeEmail");
const { getUserRaw } = require("login.dfe.api-client/users");

jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);

jest.mock("login.dfe.api-client/users", () => ({ getUserRaw: jest.fn() }));

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

    getUserRaw.mockReset().mockResolvedValue({
      isInternalUser: false,
      isEntra: true,
      entraOid: "userEntraOid",
    });
  });

  it("should call next if the user's email address is authorized to be changed", async () => {
    await isAuthorizedToChangeEmail(req, res, next);

    expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user-id" } });
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
    getUserRaw.mockReset().mockResolvedValue({
      isInternalUser: true,
      isEntra: true,
      entraOid: "userEntraOid",
    });

    await isAuthorizedToChangeEmail(req, res, next);

    expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user-id" } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith("errors/views/notAuthorised");
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next with error if an exception occurs", async () => {
    const error = new Error("it error");
    getUserRaw.mockRejectedValue(error);

    await isAuthorizedToChangeEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
