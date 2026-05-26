jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils");

const { getRequestMock, getResponseMock } = require("./../../utils");
const accessRequestUtils = require("./../../../src/app/accessRequests/utils");
const {
  get,
} = require("./../../../src/app/accessRequests/reviewServiceRequest");

const res = getResponseMock();

describe("when reviewing a service request GET", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: { rid: "req-1" },
    });

    accessRequestUtils.getAndMapServiceRequest.mockReset().mockReturnValue({
      id: "req-1",
      usersName: "Jane Doe",
      usersEmail: "jane.doe@test.com",
      serviceName: "Service A",
      org_id: "org-1",
      org_name: "Org One",
      user_id: "user-1",
      service_id: "svc-1",
      created_date: "2024-01-01",
      request_type: { id: "service", name: "Service access" },
      status: { id: 0, name: "Pending" },
    });

    res.mockResetAll();
  });

  it("should render the reviewServiceRequest view", async () => {
    await get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/reviewServiceRequest",
    );
  });

  it("should include csrf token", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({ csrfToken: "token" });
  });

  it("should include the mapped request", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1].request).toMatchObject({
      id: "req-1",
      usersName: "Jane Doe",
      usersEmail: "jane.doe@test.com",
    });
  });

  it("should return 404 when request is not found", async () => {
    accessRequestUtils.getAndMapServiceRequest.mockReturnValue(null);

    await get(req, res);

    expect(res.status.mock.calls[0][0]).toBe(404);
    expect(res.render).toHaveBeenCalledWith("errors/notFound");
  });
});
