const {
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged,
} = require("./../../../src/app/users/getManageConsoleRoles");

jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory({
    support: {
      type: "api",
      service: {
        url: "http://support.test",
      },
    },
    access: {
      identifiers: {
        departmentForEducation: "departmentForEducation1",
        manageService: "manageService1",
      },
    },
  }),
);

jest.mock("./../../../src/infrastructure/utils", () => ({
  sendResult: jest.fn(),
}));

jest.mock("./../../../src/app/users/utils", () => ({
  getUserDetails: jest.fn(),
}));
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/access", () => ({
  updateUserService: jest.fn(),
}));
const { getServiceRaw } = require("login.dfe.api-client/services");

describe("when manage a users manage console roles", () => {
  describe("when displaying manage console role assignment options", () => {
    it("should return service details for a user", async () => {
      const { getUserServiceRaw } = require("login.dfe.api-client/users");

      getServiceRaw.mockResolvedValue({ name: "Test Service" });
      getUserServiceRaw.mockResolvedValue({
        serviceId: "service-id",
        roles: ["role1"],
      });

      const result = await getSingleServiceForUser(
        "user-id",
        "org-id",
        "service-id",
        "correlation-id",
      );

      expect(result).toEqual({
        id: "service-id",
        roles: ["role1"],
        name: "Test Service",
      });
    });

    it("should return service details for an invitation user", async () => {
      const {
        getInvitationServiceRaw,
      } = require("login.dfe.api-client/invitations");

      getServiceRaw.mockResolvedValue({ name: "Test Service" });
      getInvitationServiceRaw.mockResolvedValue({
        serviceId: "service-id",
        roles: ["role1"],
      });

      const result = await getSingleServiceForUser(
        "inv-user-id",
        "org-id",
        "service-id",
        "correlation-id",
      );

      expect(result).toEqual({
        id: "service-id",
        roles: ["role1"],
        name: "Test Service",
      });
    });
  });

  describe("when setting the title within the support console for the manage console roles opperation", () => {
    it("should return true if user has a manage console role", () => {
      const userManageRoles = { roles: [{ id: "role1" }, { id: "role2" }] };
      const manageConsoleRoleIds = ["role1", "role3"];

      const result = addOrChangeManageConsoleServiceTitle(
        userManageRoles,
        manageConsoleRoleIds,
      );

      expect(result).toBe(true);
    });

    it("should return false if user does not have a manage console role", () => {
      const userManageRoles = { roles: [{ id: "role1" }, { id: "role2" }] };
      const manageConsoleRoleIds = ["role3", "role4"];

      const result = addOrChangeManageConsoleServiceTitle(
        userManageRoles,
        manageConsoleRoleIds,
      );

      expect(result).toBe(false);
    });
  });

  describe("when checking if role assignment has been changed", () => {
    it("should return false if roles have not changed", () => {
      const rolesSelectedBeforeSession = ["role1", "role2"];
      const newRolesSelected = ["role1", "role2"];

      const result = checkIfRolesChanged(
        rolesSelectedBeforeSession,
        newRolesSelected,
      );

      expect(result).toBe(false);
    });

    it("should return true if roles have changed", () => {
      const rolesSelectedBeforeSession = ["role1", "role2"];
      const newRolesSelected = ["role1", "role3"];

      const result = checkIfRolesChanged(
        rolesSelectedBeforeSession,
        newRolesSelected,
      );

      expect(result).toBe(true);
    });
  });
});
