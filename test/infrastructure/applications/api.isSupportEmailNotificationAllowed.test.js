const {
  isSupportEmailNotificationAllowed,
} = require("../../../src/infrastructure/applications/api");

const { getServiceToggleFlagsRaw } = require("login.dfe.api-client/services");

jest.mock("login.dfe.api-client/services");

describe("isSupportEmailNotificationAllowed", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return true if the flag is set to true", async () => {
    getServiceToggleFlagsRaw.mockResolvedValue([{ flag: true }]);

    const result = await isSupportEmailNotificationAllowed();

    expect(result).toBe(true);
    expect(getServiceToggleFlagsRaw).toHaveBeenCalledWith({
      filters: { serviceToggleType: "email", serviceName: "support" },
    });
  });

  it("should return false if the flag is set to false", async () => {
    getServiceToggleFlagsRaw.mockResolvedValue([{ flag: false }]);

    const result = await isSupportEmailNotificationAllowed();

    expect(result).toBe(false);
  });

  it("should return true if the toggle flag array is empty", async () => {
    getServiceToggleFlagsRaw.mockResolvedValue([]);

    const result = await isSupportEmailNotificationAllowed();

    expect(result).toBe(true);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    getServiceToggleFlagsRaw.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    await expect(isSupportEmailNotificationAllowed()).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
