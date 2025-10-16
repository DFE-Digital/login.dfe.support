const {
  getSearchIndexUsersRaw,
  mapSupportUserSortByToSearchApi,
} = require("login.dfe.api-client/users");

const {
  mapSearchUserToSupportModel,
} = require("../../../../src/app/users/userSearchHelpers/mapSearchUserToSupportModel");

const {
  searchAndMapUsers,
} = require("../../../../src/app/users/userSearchHelpers/searchAndMapUsers");

jest.mock("login.dfe.api-client/users", () => ({
  getSearchIndexUsersRaw: jest.fn(),
  mapSupportUserSortByToSearchApi: jest.fn(),
}));

jest.mock(
  "../../../../src/app/users/userSearchHelpers/mapSearchUserToSupportModel",
  () => ({
    mapSearchUserToSupportModel: jest.fn(),
  }),
);

describe("searchAndMapUsers", () => {
  const fakeApiResponse = {
    numberOfPages: 1,
    totalNumberOfResults: 1,
    users: [
      {
        id: "fake-user-id-1",
        firstName: "FakeFirstName",
        lastName: "FakeLastName",
        email: "fake.email@example.com",
        primaryOrganisation: "Fake Primary Org",
        organisations: [
          {
            id: "fake-org-id-1",
            name: "Fake Organisation One",
            statusId: 1,
            roleId: 1000,
          },
        ],
        services: ["fake-service-1", "fake-service-2"],
        lastLogin: new Date("2025-01-01T10:00:00Z"),
        numberOfSuccessfulLoginsInPast12Months: 3,
        statusLastChangedOn: new Date("2024-06-15T15:30:00Z"),
        statusId: 1,
        pendingEmail: "pending.fake@example.com",
        legacyUsernames: ["fakeuser_legacy1"],
      },
    ],
  };

  const mappedUser = {
    id: "fake-user-id-1",
    firstName: "FakeFirstName",
    lastName: "FakeLastName",
    email: "fake.email@example.com",
    primaryOrganisation: "Fake Primary Org",
    organisations: [
      {
        id: "fake-org-id-1",
        name: "Fake Organisation One",
        statusId: 1,
        roleId: 1000,
      },
    ],
    services: ["fake-service-1", "fake-service-2"],
    lastLogin: new Date("2025-01-01T10:00:00Z"),
    numberOfSuccessfulLoginsInPast12Months: 3,
    statusLastChangedOn: new Date("2024-06-15T15:30:00Z"),
    statusId: 1,
    pendingEmail: "pending.fake@example.com",
    legacyUsernames: ["fakeuser_legacy1"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSearchIndexUsersRaw.mockResolvedValue(fakeApiResponse);
    mapSupportUserSortByToSearchApi.mockReturnValue("searchableName");
    mapSearchUserToSupportModel.mockReturnValue(mappedUser);
  });

  it("should call apiClient getSearchIndexUsersRaw and map and return users correctly", async () => {
    const searchParams = {
      criteria: "FakeFirstName",
      pageNumber: 1,
      sortBy: "name",
      sortAsc: true,
      filterBy: { organisationId: "fake-organisation-id" },
    };

    const result = await searchAndMapUsers(searchParams);

    expect(mapSupportUserSortByToSearchApi).toHaveBeenCalledWith({
      sortBy: "name",
    });

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith({
      searchCriteria: "FakeFirstName",
      pageNumber: 1,
      sortBy: "searchableName",
      sortDirection: "asc",
      filterBy: { organisationId: "fake-organisation-id" },
    });

    expect(mapSearchUserToSupportModel).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      numberOfPages: 1,
      totalNumberOfResults: 1,
      users: [mappedUser],
    });
  });

  it("should call apiClient getSearchIndexUsersRaw function with descending sort direction when sortAsc is false", async () => {
    const searchParams = {
      criteria: "fake-user-name-2",
      pageNumber: 2,
      sortBy: "email",
      sortAsc: false,
      filterBy: { organisationId: "fake-organisation-id" },
    };

    await searchAndMapUsers(searchParams);

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: "desc" }),
    );
  });

  it("should call apiClient getSearchIndexUsersRaw function with descending sort direction when sortAsc is true", async () => {
    const searchParams = {
      criteria: "fake-user-name-2",
      pageNumber: 2,
      sortBy: "email",
      sortAsc: true,
      filterBy: { organisationId: "fake-organisation-id" },
    };

    await searchAndMapUsers(searchParams);

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: "asc" }),
    );
  });

  it("should call apiClient getSearchIndexUsersRaw function without sortDirection when sortAsc is not provided", async () => {
    const searchParams = {
      criteria: "fake-user-name-3",
      pageNumber: 1,
      sortBy: "email",
      filterBy: { organisationId: "fake-organisation-id" },
    };

    await searchAndMapUsers(searchParams);

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: undefined }),
    );
  });

  it("should call apiClient getSearchIndexUsersRaw function without sortBy and not call sortBy mapper when sortBy is missing", async () => {
    const searchParams = {
      criteria: "fake-user-name-4",
      pageNumber: 1,
      sortAsc: true,
      filterBy: { organisationId: "fake-organisation-id" },
    };

    await searchAndMapUsers(searchParams);

    expect(mapSupportUserSortByToSearchApi).not.toHaveBeenCalled();

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: undefined }),
    );
  });
});
