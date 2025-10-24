jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory({
    support: {
      type: "api",
      service: {
        url: "http://support.test",
      },
    },
    access: {
      type: "static",
      identifiers: {
        service: "service1",
        organisation: "organisation1",
        departmentForEducation: "departmentForEducation1",
        manageService: "manageService1",
      },
    },
  }),
);
jest.mock("login.dfe.policy-engine");
jest.mock("./../../../src/app/users/getManageConsoleRoles");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRolesRaw: jest.fn(),
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/app/users/utils", () => {
  const actual = jest.requireActual("./../../../src/app/users/utils");

  return {
    callServiceToUserFunc: actual.callServiceToUserFunc,
    getUserDetails: jest.fn(),
    getUserDetailsById: jest.fn(),
  };
});

jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/users");

// Import dependencies
const postManageConsoleRoles = require("./../../../src/app/users/postManageConsoleRoles");
const {
  getServiceRolesRaw,
  getServiceRaw,
} = require("login.dfe.api-client/services");
const {
  addServiceToUser,
  updateUserServiceRoles,
  getUserServiceRaw,
  addOrganisationToUser,
} = require("login.dfe.api-client/users");
const { getUserDetails } = require("./../../../src/app/users/utils");
const {
  getSingleServiceForUser,
  checkIfRolesChanged,
} = require("./../../../src/app/users/getManageConsoleRoles");

describe("when changing a user's manage console access", () => {
  let req, res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      user: {
        sub: "user1",
        email: "super.user@unit.test",
      },
      body: {
        role: ["role1", "role2"],
      },
      params: {
        uid: "userId",
        sid: "testService1",
      },
      session: {},
    };

    res = {
      render: jest.fn(),
      flash: jest.fn(),
      redirect: jest.fn(),
    };

    getServiceRolesRaw.mockResolvedValue([
      {
        id: "role1",
        name: "test service 1 - Service Access Management",
        code: "testService1_accessManage",
        numericId: "23173",
        status: { id: 1 },
      },
      {
        id: "role2",
        name: "test service 1 - Service Banner",
        code: "testService1_serviceBanner",
        numericId: "23175",
        status: { id: 1 },
      },
      {
        id: "role3",
        name: "test service 1 - Service Configuration",
        code: "testService1_serviceconfig",
        numericId: "23172",
        status: { id: 1 },
      },
      {
        id: "role4",
        name: "test service 2 - Service Support",
        code: "testService1_serviceSup",
        numericId: "23174",
        status: { id: 1 },
      },
    ]);

    getServiceRaw.mockResolvedValue({
      name: "Test Service",
      id: "testService1",
    });
    getUserServiceRaw.mockResolvedValue({
      serviceId: "service-id",
      roles: [{ id: "role1" }],
    });
    getSingleServiceForUser.mockResolvedValue({
      id: "testService1",
      roles: [{ id: "role1" }],
      name: "applicationName",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update user services", async () => {
    checkIfRolesChanged.mockResolvedValue(false);
    getUserDetails.mockResolvedValue({
      hasManageAccess: true,
    });

    await postManageConsoleRoles(req, res);

    expect(updateUserServiceRoles).toHaveBeenCalledTimes(1);
    expect(updateUserServiceRoles).toHaveBeenCalledWith({
      organisationId: "departmentForEducation1",
      serviceId: "manageService1",
      serviceRoleIds: ["role1", "role2"],
      userId: "userId",
    });
  });

  it("should redirect the user to the manage console services endpoint with a flash message if updating the service", async () => {
    getUserDetails.mockResolvedValue({
      hasManageAccess: true,
    });

    await postManageConsoleRoles(req, res);

    expect(updateUserServiceRoles).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith("info", [
      "Roles updated",
      "The selected roles have been updated for Test Service",
    ]);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      "/users/userId/manage-console-services",
    );
  });

  it("should redirect the user to the manage console services endpoint with a flash message if adding the service", async () => {
    getUserDetails.mockResolvedValue({
      hasManageAccess: false,
    });

    await postManageConsoleRoles(req, res);

    expect(addServiceToUser).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith("info", [
      "Roles updated",
      "The selected roles have been updated for Test Service",
    ]);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      "/users/userId/manage-console-services",
    );
  });

  it("should call addServiceToUser if hasManageAccess is false", async () => {
    checkIfRolesChanged.mockResolvedValue(false);
    getUserDetails.mockResolvedValue({
      hasManageAccess: false,
    });

    await postManageConsoleRoles(req, res);

    expect(addOrganisationToUser).toHaveBeenCalledTimes(1);
    expect(addServiceToUser).toHaveBeenCalledTimes(1);
    expect(updateUserServiceRoles).not.toHaveBeenCalled();
    expect(addServiceToUser).toHaveBeenCalledWith({
      organisationId: "departmentForEducation1",
      serviceId: "manageService1",
      serviceRoleIds: ["role1", "role2"],
      userId: "userId",
    });
  });
});
