jest.mock("login.dfe.api-client/services", () => ({
  getPaginatedServicesRaw: jest.fn(),
  getServiceToggleFlagsRaw: jest.fn(),
}));

const {
  getAllServices,
  isSupportEmailNotificationAllowed,
} = require("../../../src/app/services/utils");
const {
  getPaginatedServicesRaw,
  getServiceToggleFlagsRaw,
} = require("login.dfe.api-client/services");

describe("getAllServices", () => {
  beforeEach(() => {
    getPaginatedServicesRaw.mockReset();
  });

  it("should call getPaginatedServicesRaw once with correct arguments for single page", async () => {
    getPaginatedServicesRaw.mockResolvedValue({
      services: [
        { id: "service1Id", name: "Service 1" },
        { id: "service2Id", name: "Service 2" },
      ],
      numberOfPages: 1,
    });

    const result = await getAllServices();

    expect(getPaginatedServicesRaw).toHaveBeenCalledTimes(1);
    expect(getPaginatedServicesRaw).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 50,
    });

    expect(result.services).toHaveLength(2);
    expect(result.services[0].id).toBe("service1Id");
    expect(result.services[1].id).toBe("service2Id");
  });

  it("should fetch multiple pages when numberOfPages > 1", async () => {
    getPaginatedServicesRaw
      .mockResolvedValueOnce({
        services: [{ id: "service1Id", name: "Service 1" }],
        numberOfPages: 2,
      })
      .mockResolvedValueOnce({
        services: [{ id: "service2Id", name: "Service 2" }],
        numberOfPages: 2,
      });

    const result = await getAllServices();

    expect(getPaginatedServicesRaw).toHaveBeenCalledTimes(2);
    expect(getPaginatedServicesRaw).toHaveBeenNthCalledWith(1, {
      pageNumber: 1,
      pageSize: 50,
    });
    expect(getPaginatedServicesRaw).toHaveBeenNthCalledWith(2, {
      pageNumber: 2,
      pageSize: 50,
    });

    expect(result.services).toHaveLength(2);
    expect(result.services.map((s) => s.id)).toEqual([
      "service1Id",
      "service2Id",
    ]);
  });

  it("should return an empty array if no services are found", async () => {
    getPaginatedServicesRaw.mockResolvedValue({
      services: [],
      numberOfPages: 1,
    });

    const result = await getAllServices();

    expect(getPaginatedServicesRaw).toHaveBeenCalledTimes(1);
    expect(result.services).toEqual([]);
  });

  it("should throw if getPaginatedServicesRaw throws an error", async () => {
    getPaginatedServicesRaw.mockRejectedValue(new Error("API failure"));

    await expect(getAllServices()).rejects.toThrow("API failure");
    expect(getPaginatedServicesRaw).toHaveBeenCalledTimes(1);
  });
});

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
