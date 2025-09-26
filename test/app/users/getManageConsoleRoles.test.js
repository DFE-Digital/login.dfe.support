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

jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/users");
jest.mock("./../../../src/infrastructure/applications", () => ({
  getServiceById: jest.fn(),
}));

jest.mock("./../../../src/infrastructure/access", () => ({
  listRolesOfService: jest.fn(),
  getSingleInvitationService: jest.fn(),
  updateUserService: jest.fn(),
}));

describe("when manage a users manage console roles", () => {
  describe("when displaying manage console role assignment options", () => {
    it("should return service details for a user", async () => {
      const {
        getServiceById,
      } = require("./../../../src/infrastructure/applications");
      const { getUserServiceRaw } = require("login.dfe.api-client/users");

      getServiceById.mockResolvedValue({ name: "Test Service" });
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
        getServiceById,
      } = require("./../../../src/infrastructure/applications");
      const {
        getSingleInvitationService,
      } = require("./../../../src/infrastructure/access");

      getServiceById.mockResolvedValue({ name: "Test Service" });
      getSingleInvitationService.mockResolvedValue({
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
