jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.jobs-client");

const { getRequestMock, getResponseMock } = require("./../../utils");
const { sendResult } = require("./../../../src/infrastructure/utils");
const { getUserDetailsById } = require("./../../../src/app/users/utils");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const webServiceSync = require("./../../../src/app/users/webServiceSync");

const res = getResponseMock();
const user = { id: "user-1", name: "user one" };
const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

describe("when syncing user for sync", function () {
  let req;

  beforeEach(() => {
    getUserDetailsById.mockReset().mockReturnValue(user);

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(
      () => serviceNotificationsClient,
    );

    req = getRequestMock({
      params: {
        uid: "user-1",
      },
    });

    res.mockResetAll();
  });

  it("then it should prompt for confirmation with organisation details", async () => {
    await webServiceSync.get(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "users/views/webServiceSync",
      {
        csrfToken: req.csrfToken(),
        user,
      },
    );
  });

  it("then it should queue organisation for sync on confirmation", async () => {
    await webServiceSync.post(req, res);

    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith({
      sub: "user-1",
    });
  });

  it("then it should add flash message that organisation has been queued on confirmation", async () => {
    await webServiceSync.post(req, res);

    expect(res.flash).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "User has been queued for sync",
    );
  });

  it("then it should redirect to organisation details page on confirmation", async () => {
    await webServiceSync.post(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/users/user-1/organisations");
  });
});
