jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils", () => ({
  sendResult: jest.fn(),
}));
jest.mock("../../../src/app/services/utils", () => ({
  getAllServices: jest.fn(),
}));
jest.mock("./../../../src/app/users/utils", () => ({
  getUserDetailsById: jest.fn(),
}));
const getManageConsoleServices = require("./../../../src/app/users/getManageConsoleServices");
const { sendResult } = require("./../../../src/infrastructure/utils");
const { getAllServices } = require("../../../src/app/services/utils");
const { getUserDetailsById } = require("./../../../src/app/users/utils");

describe("When retrieving manage console services for a user", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: "GET",
      query: "GET",
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      user: {
        sub: "user1",
        email: "super.user@unit.test",
      },
      params: {
        uid: "user1",
      },
      session: {},
    };

    res = {
      render: jest.fn(),
    };

    getUserDetailsById.mockReset();
    getUserDetailsById.mockReturnValue({
      id: "user1",
    });

    const allServices = {
      services: [
        {
          id: "service1Id",
          name: "Service 1",
          description: "Service for testing purposes",
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: "service2Id",
          name: "Service 2",
          description: "Service for testing purposes",
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: "service3Id",
          name: "Service 3",
          description: "Service for testing purposes",
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: "hiddenServiceId",
          name: "Hidden Service",
          description: "A service hidden from support",
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {
            params: {
              hideApprover: "true",
              hideSupport: "true",
              helpHidden: "true",
            },
          },
        },
        {
          id: "idOnlyHiddenId",
          name: "Id Only Hidden Service",
          description: "An id-only service that is hidden",
          isExternalService: true,
          isIdOnlyService: true,
          isHiddenService: 1,
          relyingParty: {},
        },
      ],
    };

    getAllServices.mockReset();
    getAllServices.mockReturnValue(allServices);
  });

  it("should call getUserDetails", async () => {
    await getManageConsoleServices(req, res);

    expect(getUserDetailsById).toHaveBeenCalled();
    expect(getUserDetailsById.mock.calls[0]).toHaveLength(2);
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: "user1",
    });
  });

  it("should not include services where hideSupport is truthy", async () => {
    await getManageConsoleServices(req, res);

    const pageServices = sendResult.mock.calls[0][3].pageOfServices.services;
    expect(
      pageServices.find((s) => s.id === "hiddenServiceId"),
    ).toBeUndefined();
  });

  it("should include services where hideSupport is not set", async () => {
    await getManageConsoleServices(req, res);

    const pageServices = sendResult.mock.calls[0][3].pageOfServices.services;
    expect(pageServices.find((s) => s.id === "service1Id")).toBeDefined();
    expect(pageServices.find((s) => s.id === "service2Id")).toBeDefined();
    expect(pageServices.find((s) => s.id === "service3Id")).toBeDefined();
  });

  it("should call sendResult", async () => {
    await getManageConsoleServices(req, res);

    expect(sendResult).toHaveBeenCalled();
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: "user1",
    });
    expect(
      sendResult.mock.calls[0][3].pageOfServices.services[0],
    ).toMatchObject({
      id: "service1Id",
      name: "Service 1",
      description: "Service for testing purposes",
      isExternalService: true,
      isIdOnlyService: false,
      isHiddenService: false,
      relyingParty: {},
    });
  });

  it("should not include id-only services where isHiddenService is truthy", async () => {
    await getManageConsoleServices(req, res);

    const pageServices = sendResult.mock.calls[0][3].pageOfServices.services;
    expect(pageServices.find((s) => s.id === "idOnlyHiddenId")).toBeUndefined();
  });

  it("should include id-only services where isHiddenService is falsy", async () => {
    getAllServices.mockReturnValue({
      services: [
        {
          id: "idOnlyVisibleId",
          name: "Id Only Visible Service",
          description: "An id-only service that is visible",
          isExternalService: true,
          isIdOnlyService: true,
          isHiddenService: 0,
          relyingParty: {},
        },
      ],
    });

    await getManageConsoleServices(req, res);

    const pageServices = sendResult.mock.calls[0][3].pageOfServices.services;
    expect(pageServices.find((s) => s.id === "idOnlyVisibleId")).toBeDefined();
  });
});
