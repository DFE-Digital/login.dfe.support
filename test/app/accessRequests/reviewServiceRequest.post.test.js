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
  post,
} = require("./../../../src/app/accessRequests/reviewServiceRequest");

const res = getResponseMock();

const mockRequest = {
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
};

describe("when reviewing a service request POST", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: { rid: "req-1" },
      body: { selectedResponse: "approve" },
    });

    accessRequestUtils.getAndMapServiceRequest
      .mockReset()
      .mockReturnValue(mockRequest);

    res.mockResetAll();
  });

  it("should return 404 when request is not found", async () => {
    accessRequestUtils.getAndMapServiceRequest.mockReturnValue(null);

    await post(req, res);

    expect(res.status.mock.calls[0][0]).toBe(404);
    expect(res.render).toHaveBeenCalledWith("errors/notFound");
  });

  it("should re-render with validation error when no response selected", async () => {
    req.body.selectedResponse = null;

    await post(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/reviewServiceRequest",
    );
    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      selectedResponse: "Approve or Reject must be selected",
    });
  });

  it("should redirect to absolute reject path when reject selected", async () => {
    req.body.selectedResponse = "reject";

    await post(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe(
      "/access-requests/req-1/service-request/reject",
    );
  });

  it("should redirect to absolute approve path when approve selected", async () => {
    req.body.selectedResponse = "approve";

    await post(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe(
      "/access-requests/req-1/service-request/approve",
    );
  });
});
