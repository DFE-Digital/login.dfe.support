const { isInternalEntraUser } = require("../../../src/infrastructure/utils");

describe("isInternalEntraUser helper function", () => {
  it("should return true when user is internal DSI user, `is_entra` flag is true, and `entra_oid` is not null", () => {
    const user = {
      isInternalUser: true,
      isEntra: true,
      entraOid: "entra-oid",
    };
    expect(isInternalEntraUser(user)).toBe(true);
  });

  it("should return false when user is not internal DSI user", () => {
    const user = {
      isInternalUser: false,
      isEntra: true,
      entraOid: "some-oid",
    };
    expect(isInternalEntraUser(user)).toBe(false);
  });

  it("should return false when user has `is_entra` flag set to false", () => {
    const user = {
      isInternalUser: true,
      isEntra: false,
      entraOid: "some-oid",
    };
    expect(isInternalEntraUser(user)).toBe(false);
  });

  it("should return false when user does not have entraOid", () => {
    const user = {
      isInternalUser: true,
      isEntra: true,
      entraOid: null,
    };
    expect(isInternalEntraUser(user)).toBe(false);
  });

  it("should return false when user is undefined", () => {
    const user = undefined;
    expect(isInternalEntraUser(user)).toBe(false);
  });

  it("should return false when user is null", () => {
    const user = null;
    expect(isInternalEntraUser(user)).toBe(false);
  });

  it("should return false when user is an empty object", () => {
    const user = {};
    expect(isInternalEntraUser(user)).toBe(false);
  });
});
