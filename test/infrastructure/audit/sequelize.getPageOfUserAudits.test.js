jest.mock("../../../src/infrastructure/audit/sequelize-schema", () => ({
  db: {
    query: jest.fn(),
  },
  logs: {},
}));

const { db } = require("../../../src/infrastructure/audit/sequelize-schema");
const {
  getPageOfUserAudits,
} = require("../../../src/infrastructure/audit/sequelize");

const emptyResult = () => {
  db.query.mockResolvedValueOnce([{ count: 0 }]).mockResolvedValueOnce([]);
};

describe("getPageOfUserAudits", () => {
  beforeEach(() => {
    db.query.mockReset();
    emptyResult();
  });

  it("uses TRY_CAST for the userId subquery so inv-prefixed IDs do not cause a SQL type error", async () => {
    await getPageOfUserAudits("inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const sqlCalls = db.query.mock.calls;
    sqlCalls.forEach(([sql]) => {
      expect(sql).toMatch(/TRY_CAST\(:userId AS UNIQUEIDENTIFIER\)/);
    });
  });

  it("still passes the full inv-prefixed id as the replacement so the editedUser meta lookup works", async () => {
    await getPageOfUserAudits("inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const [, opts] = db.query.mock.calls[0];
    expect(opts.replacements.userId).toBe(
      "inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0",
    );
  });

  it("works correctly with a standard UUID for active users (no regression)", async () => {
    db.query.mockReset();
    emptyResult();
    await getPageOfUserAudits("05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const [, opts] = db.query.mock.calls[0];
    expect(opts.replacements.userId).toBe(
      "05CF0E9E-E334-435E-A9D9-126E0ABAE7D0",
    );
  });

  it("matches JSON-quoted meta values stored by the Service Bus Subscriber alongside plain values", async () => {
    await getPageOfUserAudits("inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const sqlCalls = db.query.mock.calls;
    sqlCalls.forEach(([sql]) => {
      expect(sql).toMatch(/CONCAT\s*\(\s*'"'\s*,\s*:userId\s*,\s*'"'\s*\)/);
    });
  });

  it("also matches bare UUID (without inv- prefix) for invited users, as login.dfe.services stores editedUser without the prefix", async () => {
    await getPageOfUserAudits("inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const sqlCalls = db.query.mock.calls;
    sqlCalls.forEach(([sql, opts]) => {
      expect(opts.replacements.userIdBare).toBe(
        "05CF0E9E-E334-435E-A9D9-126E0ABAE7D0",
      );
      expect(sql).toMatch(/:userIdBare/);
      expect(sql).toMatch(/CONCAT\s*\(\s*'"'\s*,\s*:userIdBare\s*,\s*'"'\s*\)/);
    });
  });

  it("also checks the 'invitedUser' metadata key so approver/user-invited events from login.dfe.services are found", async () => {
    await getPageOfUserAudits("inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0", 1);
    const sqlCalls = db.query.mock.calls;
    sqlCalls.forEach(([sql]) => {
      expect(sql).toMatch(/'invitedUser'/);
    });
  });

  it("unwraps JSON-quoted string meta values returned from the database", async () => {
    db.query.mockReset();
    db.query.mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([
      {
        id: "audit-id-1",
        type: "approver",
        subType: "user-service-updated",
        userId: "approver-uuid",
        level: "audit",
        message: "approver added service",
        createdAt: new Date("2026-01-01"),
        organisationid: "org-uuid",
        key: "serviceId",
        value: '"service-uuid-with-json-quotes"',
      },
    ]);

    const result = await getPageOfUserAudits(
      "inv-05CF0E9E-E334-435E-A9D9-126E0ABAE7D0",
      1,
    );

    expect(result.audits).toHaveLength(1);
    expect(result.audits[0].serviceId).toBe("service-uuid-with-json-quotes");
  });
});
