const { mapSearchUserToSupportModel } = require("../../../src/app/users/utils");
const { mapUserStatus } = require("../../../src/infrastructure/utils");

jest.mock("../../../src/infrastructure/utils/mapUserStatus", () => ({
  mapUserStatus: jest.fn(),
}));

describe("mapSearchUserToSupportModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly map a full user object to the support model", () => {
    const inputUser = {
      id: "user-123",
      firstName: "Fake-first-name",
      lastName: "Fake-last-name",
      email: "fake-email@example.com",
      primaryOrganisation: "Fake Primary Organisation",
      organisations: [
        "Fake Primary Organisation",
        "Fake Secondary Organisation",
      ],
      lastLogin: "2023-12-01T10:00:00Z",
      numberOfSuccessfulLoginsInPast12Months: 42,
      statusId: 1,
      statusLastChangedOn: "2023-11-15T09:30:00Z",
      pendingEmail: "fake-pending-email@example.com",
    };

    mapUserStatus.mockReturnValue("Active");

    const result = mapSearchUserToSupportModel(inputUser);

    expect(result).toEqual({
      id: "user-123",
      name: "Fake-first-name Fake-last-name",
      firstName: "Fake-first-name",
      lastName: "Fake-last-name",
      email: "fake-email@example.com",
      organisation: {
        name: "Fake Primary Organisation",
      },
      organisations: [
        "Fake Primary Organisation",
        "Fake Secondary Organisation",
      ],
      lastLogin: new Date("2023-12-01T10:00:00Z"),
      successfulLoginsInPast12Months: 42,
      status: "Active",
      pendingEmail: "fake-pending-email@example.com",
    });

    expect(mapUserStatus).toHaveBeenCalledWith(1, "2023-11-15T09:30:00Z");
  });

  it("should return null for organisation if primaryOrganisation is not set", () => {
    const inputUser = {
      id: "fake-user-id",
      firstName: "Fake-first-name",
      lastName: "Fake-last-name",
      email: "fake-email@example.com",
      primaryOrganisation: null,
      organisations: [],
      lastLogin: null,
      numberOfSuccessfulLoginsInPast12Months: 0,
      statusId: 2,
      statusLastChangedOn: null,
      pendingEmail: null,
    };

    mapUserStatus.mockReturnValue("Inactive");

    const result = mapSearchUserToSupportModel(inputUser);

    expect(result.organisation).toBeNull();
    expect(result.lastLogin).toBeNull();
    expect(result.status).toBe("Inactive");

    expect(mapUserStatus).toHaveBeenCalledWith(2, null);
  });

  it("should handle missing optional fields gracefully", () => {
    const inputUser = {
      id: "user-789",
      firstName: "Fake-first-name",
      lastName: "Fake-last-name",
      email: "fake-email@example.com",
      primaryOrganisation: undefined,
      organisations: undefined,
      lastLogin: undefined,
      numberOfSuccessfulLoginsInPast12Months: undefined,
      statusId: 3,
      statusLastChangedOn: undefined,
      pendingEmail: undefined,
    };

    mapUserStatus.mockReturnValue("Pending");

    const result = mapSearchUserToSupportModel(inputUser);

    expect(result.organisation).toBeNull();
    expect(result.lastLogin).toBeNull();
    expect(result.successfulLoginsInPast12Months).toBeUndefined();
    expect(result.organisations).toBeUndefined();
    expect(result.pendingEmail).toBeUndefined();
    expect(result.status).toBe("Pending");

    expect(mapUserStatus).toHaveBeenCalledWith(3, undefined);
  });
});
