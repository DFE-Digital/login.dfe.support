jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils");
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/organisations");
jest.mock(
  "../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById",
);
jest.mock("login.dfe.api-client/users");

const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  post,
} = require("./../../../src/app/accessRequests/selectPermissionLevel");
const { addOrganisationToUser } = require("login.dfe.api-client/users");

const res = getResponseMock();
const {
  getAndMapOrgRequest,
} = require("./../../../src/app/accessRequests/utils");
const logger = require("./../../../src/infrastructure/logger");
const { NotificationClient } = require("login.dfe.jobs-client");

const sendAccessRequest = jest.fn();
NotificationClient.mockImplementation(() => ({
  sendAccessRequest,
}));

const {
  getOrganisationLegacyRaw,
  updateRequestForOrganisationRaw,
} = require("login.dfe.api-client/organisations");
const {
  getSearchDetailsForUserById,
} = require("../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById");
const {
  updateUserDetailsInSearchIndex,
} = require("login.dfe.api-client/users");

Date.now = jest.fn(() => "2019-01-02");

describe("when selecting a permission level", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: "user1",
        email: "email@email.com",
      },
      params: {
        orgId: "org1",
        from: "organisation",
      },
      body: {
        selectedLevel: 0,
      },
    });

    logger.audit.mockReset();
    addOrganisationToUser.mockReset();
    updateRequestForOrganisationRaw.mockReset();

    sendAccessRequest.mockReset();
    NotificationClient.mockImplementation(() => ({
      sendAccessRequest,
    }));

    getOrganisationLegacyRaw.mockReset();
    getOrganisationLegacyRaw.mockReturnValue({
      id: "org1",
      name: "organisation two",
      Category: "001",
      Status: 1,
    });

    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [],
    });

    getAndMapOrgRequest.mockReset();
    getAndMapOrgRequest.mockReturnValue({
      usersName: "John Doe",
      usersEmail: "john.doe@email.com",
      id: "requestId",
      org_id: "org1",
      org_name: "Org 1",
      user_id: "userId",
      created_date: "2019-05-01",
      actioned_date: null,
      actioned_by: null,
      actioned_reason: null,
      reason: "",
      status: {
        id: 0,
        name: "Pending",
      },
    });
    res.mockResetAll();
  });

  it("then it should render error if no permission level selected", async () => {
    req.body.selectedLevel = null;

    await post(req, res);

    expect(addOrganisationToUser.mock.calls).toHaveLength(0);
    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/selectPermissionLevel",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/access-requests/undefined/organisation/review",
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      request: {
        actioned_by: null,
        actioned_date: null,
        actioned_reason: null,
        created_date: "2019-05-01",
        id: "requestId",
        org_id: "org1",
        org_name: "Org 1",
        reason: "",
        status: {
          id: 0,
          name: "Pending",
        },
        user_id: "userId",
        usersEmail: "john.doe@email.com",
        usersName: "John Doe",
      },
      requestFrom: "organisation",
      selectedLevel: undefined,
      title: "Select permission level - DfE Sign-in",
      validationMessages: {
        selectedLevel: "A permission level must be selected",
      },
    });
  });

  it("then it should render error if no permission level is invalid", async () => {
    req.body.selectedLevel = 1000000;

    await post(req, res);

    expect(addOrganisationToUser.mock.calls).toHaveLength(0);
    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/selectPermissionLevel",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/access-requests/undefined/organisation/review",
      layout: "sharedViews/layout.ejs",
      csrfToken: "token",
      request: {
        actioned_by: null,
        actioned_date: null,
        actioned_reason: null,
        created_date: "2019-05-01",
        id: "requestId",
        org_id: "org1",
        org_name: "Org 1",
        reason: "",
        status: {
          id: 0,
          name: "Pending",
        },
        user_id: "userId",
        usersEmail: "john.doe@email.com",
        usersName: "John Doe",
      },
      requestFrom: "organisation",
      selectedLevel: 1000000,
      title: "Select permission level - DfE Sign-in",
      validationMessages: {
        selectedLevel: "A permission level must be selected",
      },
    });
  });

  it("then it should render error if request already actioned", async () => {
    getAndMapOrgRequest.mockReset().mockReturnValue({
      usersName: "John Doe",
      usersEmail: "john.doe@email.com",
      approverName: "Jane Doe",
      approverEmail: "jane.doe@email.com",
      id: "requestId",
      org_id: "org1",
      org_name: "Org 1",
      user_id: "userId",
      created_date: "2019-05-01",
      actioned_date: null,
      actioned_by: "jane.doe@email.com",
      actioned_reason: null,
      requestFrom: "organisation",
      reason: "",
      status: {
        id: 1,
        name: "approved",
      },
    });

    await post(req, res);

    expect(addOrganisationToUser.mock.calls).toHaveLength(0);
    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/selectPermissionLevel",
    );
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/access-requests/undefined/organisation/review",
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      request: {
        actioned_by: "jane.doe@email.com",
        actioned_date: null,
        actioned_reason: null,
        created_date: "2019-05-01",
        id: "requestId",
        org_id: "org1",
        org_name: "Org 1",
        reason: "",
        requestFrom: "organisation",
        status: {
          id: 1,
          name: "approved",
        },
        user_id: "userId",
        usersEmail: "john.doe@email.com",
        usersName: "John Doe",
        approverName: "Jane Doe",
        approverEmail: "jane.doe@email.com",
      },
      requestFrom: "organisation",
      selectedLevel: 0,
      title: "Select permission level - DfE Sign-in",
      validationMessages: {
        reason: "Request already actioned by jane.doe@email.com",
      },
    });
  });
  it("then it should put the user in the organisation if approved", async () => {
    await post(req, res);

    expect(addOrganisationToUser.mock.calls).toHaveLength(1);
    expect(addOrganisationToUser).toHaveBeenCalledWith({
      organisationId: "org1",
      roleId: 0,
      status: 1,
      userId: "userId",
    });
  });

  it("then it should patch the request as complete", async () => {
    await post(req, res);

    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(1);
    expect(updateRequestForOrganisationRaw).toHaveBeenCalledWith({
      actionedAt: "2019-01-02",
      actionedByUserId: "user1",
      requestId: "requestId",
      status: 1,
    });
  });

  it("then it should update the search index with the new org", async () => {
    await post(req, res);

    expect(updateUserDetailsInSearchIndex).toHaveBeenCalledTimes(1);
    expect(updateUserDetailsInSearchIndex).toHaveBeenCalledWith({
      userId: "userId",
      organisations: [
        {
          UKPRN: undefined,
          categoryId: "001",
          establishmentNumber: undefined,
          id: "org1",
          laNumber: undefined,
          name: "organisation two",
          roleId: 0,
          statusId: 1,
          uid: undefined,
          upin: undefined,
          urn: undefined,
        },
      ],
    });
  });

  it("then it should should audit approved org request", async () => {
    await post(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "email@email.com (id: user1) approved organisation request for org1)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "approver",
      subType: "approved-org",
      userId: "user1",
      editedUser: "userId",
      editedFields: [
        {
          name: "new_organisation",
          newValue: "org1",
          oldValue: undefined,
        },
      ],
    });
  });

  it("then it should redirect to the user profile for the user approved", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users/userId/organisations");
  });
});
