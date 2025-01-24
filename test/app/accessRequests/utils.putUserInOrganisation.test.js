jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/accessRequests");
jest.mock("./../../../src/infrastructure/logger");
jest.mock("login.dfe.jobs-client");

const organisations = require("./../../../src/infrastructure/organisations");
const accessRequest = require("./../../../src/infrastructure/accessRequests");
const logger = require("./../../../src/infrastructure/logger");
const { NotificationClient } = require("login.dfe.jobs-client");
const {
  putUserInOrganisation,
} = require("./../../../src/app/accessRequests/utils");

describe("When putting a user in an organisation", () => {
  let req;
  let sendAccessRequestStub;

  beforeEach(() => {
    logger.audit.mockReset();

    accessRequest.deleteAccessRequest.mockReset();
    organisations.setUserAccessToOrganisation.mockReset();

    sendAccessRequestStub = jest.fn();

    NotificationClient.mockReset().mockImplementation(() => ({
      sendAccessRequest: sendAccessRequestStub,
    }));

    req = {
      id: "reqid",
      body: {
        userOrgId: "user1Org1",
        user_id: "user1",
        org_id: "org1",
        role: "user",
        email: "user@test.com",
        approve_reject: "approve",
        message: "test message",
        name: "test user",
        org_name: "org name",
      },
      user: {
        email: "support@test.com",
        sub: "supuser1",
      },
    };
  });

  it("then it deletes the access request from the index", async () => {
    await putUserInOrganisation(req);

    expect(accessRequest.deleteAccessRequest.mock.calls).toHaveLength(1);
    expect(accessRequest.deleteAccessRequest.mock.calls[0][0]).toBe(
      "user1Org1",
    );
  });

  it("then it calls set user access to organisation", async () => {
    await putUserInOrganisation(req);

    expect(organisations.setUserAccessToOrganisation.mock.calls).toHaveLength(
      1,
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][0]).toBe(
      "user1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][1]).toBe(
      "org1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][2]).toBe(1);
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][3]).toBe(
      "reqid",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][4]).toBe(1);
  });

  it("then it calls set user access to organisation and sets the role to approver if the request role is approver", async () => {
    req.body.role = "approver";

    await putUserInOrganisation(req);

    expect(organisations.setUserAccessToOrganisation.mock.calls).toHaveLength(
      1,
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][0]).toBe(
      "user1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][1]).toBe(
      "org1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][2]).toBe(
      10000,
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][3]).toBe(
      "reqid",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][4]).toBe(1);
  });

  it("then it sets the user to rejected role and status if the access request is rejected", async () => {
    req.body.approve_reject = "rejected";

    await putUserInOrganisation(req);

    expect(organisations.setUserAccessToOrganisation.mock.calls).toHaveLength(
      1,
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][0]).toBe(
      "user1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][1]).toBe(
      "org1",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][2]).toBe(0);
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][3]).toBe(
      "reqid",
    );
    expect(organisations.setUserAccessToOrganisation.mock.calls[0][4]).toBe(-1);
  });

  it("then an email is sent if approved", async () => {
    await putUserInOrganisation(req);

    expect(sendAccessRequestStub.mock.calls).toHaveLength(1);
    expect(sendAccessRequestStub.mock.calls[0][0]).toBe("user@test.com");
    expect(sendAccessRequestStub.mock.calls[0][1]).toBe("test user");
    expect(sendAccessRequestStub.mock.calls[0][2]).toBe("org name");
    expect(sendAccessRequestStub.mock.calls[0][3]).toBe(true);
    expect(sendAccessRequestStub.mock.calls[0][4]).toBe("");
  });

  it("then an email is sent if rejected", async () => {
    req.body.approve_reject = "reject";

    await putUserInOrganisation(req);

    expect(sendAccessRequestStub.mock.calls).toHaveLength(1);
    expect(sendAccessRequestStub.mock.calls[0][0]).toBe("user@test.com");
    expect(sendAccessRequestStub.mock.calls[0][1]).toBe("test user");
    expect(sendAccessRequestStub.mock.calls[0][2]).toBe("org name");
    expect(sendAccessRequestStub.mock.calls[0][3]).toBe(false);
    expect(sendAccessRequestStub.mock.calls[0][4]).toBe("test message");
  });

  it("then no email is sent if there is no email with the access request", async () => {
    req.body.email = "";

    await putUserInOrganisation(req);

    expect(sendAccessRequestStub.mock.calls).toHaveLength(0);
  });

  it("then it audits the request", async () => {
    await putUserInOrganisation(req);

    expect(logger.audit.mock.calls).toHaveLength(1);
  });
});
