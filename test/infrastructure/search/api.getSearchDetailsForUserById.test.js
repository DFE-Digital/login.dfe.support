const { mapSearchUserToSupportModel } = require("../../../src/app/users/utils");
const {
  getSearchDetailsForUserById,
} = require("../../../src/infrastructure/search/api");
const { searchUserByIdRaw } = require("login.dfe.api-client/users");

jest.mock("login.dfe.api-client/users", () => ({
  searchUserByIdRaw: jest.fn(),
}));

jest.mock(
  "../../../src/app/users/utils",
  () => ({
    mapSearchUserToSupportModel: jest.fn(),
  }),
);

describe("getSearchDetailsForUserById", () => {
  const userId = "user-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call searchUserByIdRaw with user id", async () => {
    const apiResponse = { id: userId };
    searchUserByIdRaw.mockResolvedValue(apiResponse);
    mapSearchUserToSupportModel.mockReturnValue({ id: userId });

    const result = await getSearchDetailsForUserById(userId);

    expect(searchUserByIdRaw).toHaveBeenCalledTimes(1);
    expect(searchUserByIdRaw).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mapSearchUserToSupportModel).toHaveBeenCalledTimes(1);
    expect(mapSearchUserToSupportModel).toHaveBeenCalledWith(apiResponse);
    expect(result).toEqual({ id: userId });
  });

  it("should return undefined and not call mapSearchUserToSupportModel if searchUserByIdRaw returns undefined", async () => {
    searchUserByIdRaw.mockResolvedValue(undefined);

    const result = await getSearchDetailsForUserById(userId);

    expect(searchUserByIdRaw).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mapSearchUserToSupportModel).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should throw a wrapped error if searchUserByIdRaw throws", async () => {
    searchUserByIdRaw.mockRejectedValue(new Error("Search failed"));

    await expect(getSearchDetailsForUserById(userId)).rejects.toThrow(
      `Error getting user ${userId} from search - Search failed`,
    );

    expect(searchUserByIdRaw).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mapSearchUserToSupportModel).not.toHaveBeenCalled();
  });
});
