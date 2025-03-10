jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const postEditOrganisation = require("../../../src/app/organisations/postEditOrganisation");
const {
  getOrganisationByIdV2,
  searchOrganisations,
} = require("./../../../src/infrastructure/organisations");

const res = getResponseMock();
const orgResult = {
  id: "org-1",
  name: "organisation one",
  category: {
    id: "008",
    name: "Other Stakeholders",
  },
};

const orgResultInvalidCategory = {
  id: "org-1",
  name: "organisation one",
  category: {
    id: "011",
    name: "Government",
  },
};

const orgsResultWithNoResults = {
  organisations: [],
  page: 1,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 0,
};

const orgsResultWithResults = {
  organisations: [
    { id: "org-1", name: "organisation one" },
    { id: "org-2", name: "organisation two" },
  ],
  page: 1,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 2,
};

describe("when postEditOrganisation is called", () => {
  let req;
  let exampleErrorResponse;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        name: "Test name",
        address: "Test address",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
      params: {
        id: "org-1",
      },
    });

    res.mockResetAll();

    searchOrganisations.mockReset().mockReturnValue(orgsResultWithNoResults);
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);

    exampleErrorResponse = {
      organisation: orgResult,
      validationMessages: {},
      backLink: "users",
      csrfToken: "token",
    };
  });

  it("should render a page with an error in validationMessages if the user did not input a name or address", async () => {
    req.body.name = "";
    req.body.address = "";
    exampleErrorResponse.validationMessages.name =
      "Please update at least one of Name or Address.";

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toEqual(exampleErrorResponse);
  });

  it("should render a page with an error in validationMessages if the user used special characters for the name", async () => {
    req.body.name = "?!£";
    exampleErrorResponse.validationMessages.name =
      "Special characters cannot be used";

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toEqual(exampleErrorResponse);
  });

  it("should render a page with an error in validationMessages if the user used special characters for the address", async () => {
    req.body.address = "Adr*&$$";
    exampleErrorResponse.validationMessages.name =
      "Special characters cannot be used";

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an organisation with a matching name exists", async () => {
    searchOrganisations.mockReset().mockReturnValue(orgsResultWithResults);
    exampleErrorResponse.validationMessages.name =
      "An organisation with this name already exists";

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an organisation with an invalid category is modified", async () => {
    const invalidCategoryResponse = {
      organisation: orgResultInvalidCategory,
      validationMessages: {
        name: "You cannot edit Government organisations",
      },
      backLink: "users",
      csrfToken: "token",
    };
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResultInvalidCategory);

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(invalidCategoryResponse);
  });

  it("should redirect to the confirm page on success", async () => {
    await postEditOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/organisations/org-1/confirm-edit-organisation`,
    );
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render the page if there is an error saving to the session", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "organisations/views/editOrganisation",
      {
        csrfToken: req.csrfToken(),
        backLink: "users",
        organisation: {
          category: {
            id: "008",
            name: "Other Stakeholders",
          },
          id: "org-1",
          name: "organisation one",
        },
        validationMessages: {
          name: "Something went wrong submitting data, please try again",
        },
      },
    );
  });
});
