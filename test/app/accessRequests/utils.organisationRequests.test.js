jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/accessRequests");
jest.mock("./../../../src/infrastructure/logger");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/organisations");

const {
  mapStatusForSupport,
  userStatusMap,
  requestTypeMap,
} = require("./../../../src/app/accessRequests/utils");

describe("mapStatusForSupport", () => {
  it("maps status id 0 to Pending approver action", () => {
    const result = mapStatusForSupport({
      id: 0,
      name: "Awaiting approver action",
    });
    expect(result).toEqual({ id: 0, name: "Pending approver action" });
  });

  it("maps status id 2 to name - Escalated to support", () => {
    const result = mapStatusForSupport({ id: 2, name: "Overdue" });
    expect(result).toEqual({ id: 2, name: "Overdue - Escalated to support" });
  });

  it("maps status id 3 to name - Escalated to support", () => {
    const result = mapStatusForSupport({ id: 3, name: "No Approvers" });
    expect(result).toEqual({
      id: 3,
      name: "No Approvers - Escalated to support",
    });
  });

  it("returns an object with id and name for an unknown status id", () => {
    const result = mapStatusForSupport({ id: 99, name: "Unknown status" });
    expect(result).toEqual({ id: 99, name: "Unknown status" });
  });
});

describe("userStatusMap", () => {
  it("contains the three expected statuses with numeric ids", () => {
    expect(userStatusMap).toEqual([
      { id: 0, name: "Pending approver action" },
      { id: 2, name: "Overdue - escalated to support" },
      { id: 3, name: "No approvers - escalated to support" },
    ]);
  });
});

describe("requestTypeMap", () => {
  it("contains Organisation, Service, and Sub-Service entries", () => {
    expect(requestTypeMap).toEqual([
      { id: "Organisation", name: "Organisation" },
      { id: "Service", name: "Service" },
      { id: "Sub-Service", name: "Sub-service" },
    ]);
  });

  it("has ids matching the API allowed type filters (capitalised)", () => {
    const ids = requestTypeMap.map((t) => t.id);
    expect(ids).toContain("Organisation");
    expect(ids).toContain("Service");
    expect(ids).toContain("Sub-Service");
  });
});
