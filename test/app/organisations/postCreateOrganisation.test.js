jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const {
  searchOrganisations,
} = require("../../../src/infrastructure/organisations");
const postCreateOrganisation = require("../../../src/app/organisations/postCreateOrganisation");

const res = getResponseMock();

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

describe("when displaying the get create organisations", () => {
  let req;
  let exampleErrorResponse;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        name: "Test name",
        address: "Test address",
        ukprn: "12345678",
        category: "008",
        upin: "123456",
        urn: "654321",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
    });
    res.mockResetAll();

    searchOrganisations.mockReset().mockReturnValue(orgsResultWithNoResults);
    sendResult.mockReset();

    // Example data that each error test can modify so it doens't need to be copied
    // again and again
    exampleErrorResponse = {
      name: "Test name",
      address: "Test address",
      ukprn: "12345678",
      category: "008",
      upin: "123456",
      urn: "654321",
      validationMessages: {},
      csrfToken: "token",
      currentPage: "organisations",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
    };
  });

  it("should redirect to the confirm page on success", async () => {
    await postCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-org");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render the page if there is an error saving to the session", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "organisations/views/createOrganisation",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        currentPage: "organisations",
        layout: "sharedViews/layoutNew.ejs",
        name: "Test name",
        address: "Test address",
        ukprn: "12345678",
        category: "008",
        upin: "123456",
        urn: "654321",
        validationMessages: {
          name: "Something went wrong submitting data, please try again",
        },
      },
    );
  });

  it("should render an the page with an error in validationMessages if validation fails on name", async () => {
    req.body.name = "";
    exampleErrorResponse.name = "";
    exampleErrorResponse.validationMessages.name = "Please enter a name";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on name with special characters", async () => {
    req.body.name = "Test $%^ org";
    exampleErrorResponse.name = "Test $%^ org";
    exampleErrorResponse.validationMessages.name =
      "Special characters cannot be used";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should redirect to the confirm screen if a valid special character is used", async () => {
    // Note: ' is converted into &#39; so we're testing that the unescape works correctly here as well
    req.body.name = "Test&#39;org/";

    await postCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-org");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should redirect to the confirm screen all non-mandatory fields are empty", async () => {
    req.body = {
      name: "Test name",
      address: "",
      ukprn: "",
      category: "008",
      upin: "",
      urn: "",
    };

    await postCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-org");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render an the page with an error in validationMessages if validation fails on name with over 256 characters", async () => {
    req.body.name = "Test123456".repeat(26); // 260 character length string
    exampleErrorResponse.name = "Test123456".repeat(26);
    exampleErrorResponse.validationMessages.name =
      "Name cannot be longer than 256 characters";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on address", async () => {
    req.body.address = "123 £$% street";
    exampleErrorResponse.address = "123 £$% street";
    exampleErrorResponse.validationMessages.address =
      "Special characters cannot be used";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on ukprn", async () => {
    req.body.ukprn = "1234567890";
    exampleErrorResponse.ukprn = "1234567890";
    exampleErrorResponse.validationMessages.ukprn =
      "UKPRN can only be an 8 digit number";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on category", async () => {
    req.body.category = "";
    exampleErrorResponse.category = "";
    exampleErrorResponse.validationMessages.category =
      "Please enter a category";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on upin", async () => {
    req.body.upin = "1234567";
    exampleErrorResponse.upin = "1234567";
    exampleErrorResponse.validationMessages.upin =
      "UPIN can only be a 6 digit number";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if validation fails on urn", async () => {
    req.body.urn = "1234567";
    exampleErrorResponse.urn = "1234567";
    exampleErrorResponse.validationMessages.urn =
      "URN can only be a 6 digit number";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an organisation with a matching ukprn and/or exists", async () => {
    searchOrganisations.mockReset().mockReturnValue(orgsResultWithResults);
    exampleErrorResponse.validationMessages.ukprn =
      "An organisation with this UKPRN already exists";
    exampleErrorResponse.validationMessages.urn =
      "An organisation with this URN already exists";

    await postCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });
});
