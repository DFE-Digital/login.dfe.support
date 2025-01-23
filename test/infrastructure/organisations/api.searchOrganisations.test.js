jest.mock("login.dfe.async-retry");
jest.mock("agentkeepalive", () => {
  return {
    HttpsAgent: jest.fn(),
  };
});
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
    organisations: {
      type: "api",
      service: {
        url: "http://organisations.test",
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  searchOrganisations,
} = require("../../../src/infrastructure/organisations/api");

const criteria = "criteria";
const filterByCategories = undefined;
const filterByStatus = undefined;

const pageNumber = 1;
const correlationId = "abc123";
const apiResponse = {
  organisations: [
    {
      id: "org1",
      name: "org one",
    },
  ],
  page: 1,
  totalNumberOfPages: 2,
};

describe("when getting a page of organisations from api", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("then it should call organisations resource with page number", async () => {
    await searchOrganisations(
      criteria,
      filterByCategories,
      filterByStatus,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations?search=criteria&page=1",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should call organisations resource with page number and filterStatus if provided", async () => {
    const filterByStatusFilled = ["123", "145"];
    await searchOrganisations(
      criteria,
      filterByCategories,
      filterByStatusFilled,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations?search=criteria&page=1&filterstatus=123&filterstatus=145",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should call organisations resource with page number and filterCategories if provided", async () => {
    const filterByCategoriesFilled = ["33", "66"];
    await searchOrganisations(
      criteria,
      filterByCategoriesFilled,
      filterByStatus,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations?search=criteria&page=1&filtercategory=33&filtercategory=66",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should call organisations resource with page number, and both filterStatus and filterCategories, if provided", async () => {
    const filterByStatusFilled = ["123", "145"];
    const filterByCategoriesFilled = ["33", "66"];
    await searchOrganisations(
      criteria,
      filterByCategoriesFilled,
      filterByStatusFilled,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations?search=criteria&page=1&filtercategory=33&filtercategory=66&filterstatus=123&filterstatus=145",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await searchOrganisations(
      criteria,
      filterByCategories,
      filterByStatus,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await searchOrganisations(
      criteria,
      filterByCategories,
      filterByStatus,
      pageNumber,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });
});
