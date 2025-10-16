const {
  updateUserSearchIndex,
} = require("../../../../src/app/users/userSearchHelpers/updateUserSearchIndex");
const usersApi = require("login.dfe.api-client/users");

jest.mock("login.dfe.api-client/users", () => ({
  updateUserInSearchIndex: jest.fn(),
}));

describe("updateUserSearchIndex", () => {
  const userId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call updateUserInSearchIndex and return result when successful", async () => {
    const mockResult = { success: true };
    usersApi.updateUserInSearchIndex.mockResolvedValue(mockResult);

    const result = await updateUserSearchIndex(userId);

    expect(usersApi.updateUserInSearchIndex).toHaveBeenCalledWith({
      id: userId,
    });
    expect(result).toEqual(mockResult);
  });

  it("should return undefined if updateUserInSearchIndex throws a 404 error", async () => {
    const error = new Error("Not Found");
    error.statusCode = 404;
    usersApi.updateUserInSearchIndex.mockRejectedValue(error);

    const result = await updateUserSearchIndex(userId);

    expect(result).toBeUndefined();
  });

  it("should return undefined if updateUserInSearchIndex throws a 400 error", async () => {
    const error = new Error("Bad Request");
    error.statusCode = 400;
    usersApi.updateUserInSearchIndex.mockRejectedValue(error);

    const result = await updateUserSearchIndex(userId);

    expect(result).toBeUndefined();
  });

  it("should return undefined if updateUserInSearchIndex throws a 403 error", async () => {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    usersApi.updateUserInSearchIndex.mockRejectedValue(error);

    const result = await updateUserSearchIndex(userId);

    expect(result).toBeUndefined();
  });

  it("should throw an error if updateUserInSearchIndex throws an unexpected error", async () => {
    const error = new Error("Internal Server Error");
    error.statusCode = 500;
    usersApi.updateUserInSearchIndex.mockRejectedValue(error);

    await expect(updateUserSearchIndex(userId)).rejects.toThrow(
      "Internal Server Error",
    );
  });
});
