jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/search");
jest.mock("./../../../src/infrastructure/applications");
jest.mock("login.dfe.api-client/users");

const { getUser } = require("./../../../src/infrastructure/directories");
const {
  getServiceById,
} = require("./../../../src/infrastructure/applications");
const {
  getServicesByUserId,
} = require("./../../../src/infrastructure/organisations");
const {
  getSearchDetailsForUserById,
} = require("./../../../src/infrastructure/search");
const { getUserDetails } = require("./../../../src/app/users/utils");

describe("When getting user details", () => {
  let req;

  beforeEach(() => {
    getServicesByUserId.mockReset();

    getServiceById.mockResolvedValue({
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

    getUser.mockReset().mockReturnValue({
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
