jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/services");
jest.mock(
  "../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById",
);

const { getUserRaw } = require("login.dfe.api-client/users");
const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserDetails } = require("./../../../src/app/users/utils");
const {
  getSearchDetailsForUserById,
} = require("../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById");

describe("When getting user details", () => {
  let req;

  beforeEach(() => {
    getServiceRaw.mockResolvedValue({
      name: "Test Service",
      id: "testService1",
    });

    getSearchDetailsForUserById.mockReset().mockReturnValue({
      id: "user1",
      name: "Albus Dumbledore",
      firstName: "Albus",
      lastName: "Dumbledore",
      email: "headmaster@hogwarts.com",
      organisation: null,
      lastLogin: new Date("2017-10-24T12:35:51.633Z"),
      successfulLoginsInPast12Months: 2,
      status: {
        id: 1,
        description: "Active",
        changedOn: new Date("2017-10-24T12:35:51.633Z"),
      },
    });

    getUserRaw.mockReset().mockReturnValue({
      sub: "user1",
      name: "Albus Dumbledore",
      given_name: "Albus",
      family_name: "Dumbledore",
      email: "headmaster@hogwarts.com",
      status: {
        id: 1,
        description: "Active",
        changedOn: new Date("2017-10-24T12:35:51.633Z"),
      },
    });

    req = {
      params: {
        uid: "user1",
      },
    };
  });

  it("then it should get user from users index", async () => {
    await getUserDetails(req);

    expect(getSearchDetailsForUserById.mock.calls).toHaveLength(1);
    expect(getSearchDetailsForUserById.mock.calls[0][0]).toBe("user1");
  });
});
