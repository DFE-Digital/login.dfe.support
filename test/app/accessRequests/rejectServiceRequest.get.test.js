jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils");

const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  get,
} = require("./../../../src/app/accessRequests/rejectServiceRequest");

const res = getResponseMock();

describe("when rejecting a service request GET", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: { rid: "req-1" },
    });
    res.mockResetAll();
  });

  it("should render the rejectServiceRequest view", async () => {
    await get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/rejectServiceRequest",
    );
  });

  it("should include csrf token", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({ csrfToken: "token" });
  });

  it("should include cancel link back to review page", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      cancelLink: "/access-requests/req-1/service-request/review",
    });
  });
});
