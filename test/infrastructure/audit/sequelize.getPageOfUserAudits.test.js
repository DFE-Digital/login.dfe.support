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
});
