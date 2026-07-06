jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/invitations", () => ({
  createInvitation: jest.fn(),
  addOrganisationToInvitation: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationLegacyRaw: jest.fn(),
}));
jest.mock("./../../../src/app/users/utils", () => ({
  waitForIndexToUpdate: jest.fn(),
}));
jest.mock(
  "./../../../src/app/users/userSearchHelpers/updateUserSearchIndex",
  () => ({
    updateUserSearchIndex: jest.fn(),
  }),
);

const { getRequestMock, getResponseMock } = require("./../../utils");
const { createInvitation } = require("login.dfe.api-client/invitations");
const {
  getOrganisationLegacyRaw,
} = require("login.dfe.api-client/organisations");
const logger = require("./../../../src/infrastructure/logger");

describe("When posting postConfirmNewUser from support console", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock();
    res = getResponseMock();
    req.user = { sub: "agent-sub-1", email: "agent@education.gov.uk" };
    req.session.user = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@school.com",
      organisationId: "org-123",
      permission: 0,
    };
    req.body = {
      "invite-destination": "services{split}https://services.example.com/cb",
      "email-contents-choice": "Approve",
      "redirect-choice": "Approve",
    };
    createInvitation.mockResolvedValue("raw-inv-uuid");
    getOrganisationLegacyRaw.mockResolvedValue({
      id: "org-123",
      name: "Test School",
    });
    logger.audit.mockReset();
  });

  const findAuditCall = (subType) =>
    logger.audit.mock.calls.find(
      (c) => (c[0]?.subType || c[1]?.subType) === subType,
    );

  it("user-invited audit sets editedUser to the inv-prefixed invitation ID", async () => {
    const postConfirmNewUser = require("./../../../src/app/users/postConfirmNewUser");
    await postConfirmNewUser(req, res);
    const call = findAuditCall("user-invited");
    expect(call).toBeDefined();
    const metadata = call[1] || call[0];
    expect(metadata.editedUser).toBe("inv-raw-inv-uuid");
  });

  it("user-invited audit message includes org name and invitation ID", async () => {
    const postConfirmNewUser = require("./../../../src/app/users/postConfirmNewUser");
    await postConfirmNewUser(req, res);
    const call = findAuditCall("user-invited");
    const message = typeof call[0] === "string" ? call[0] : call[0].message;
    expect(message).toContain("Test School");
    expect(message).toContain("inv-raw-inv-uuid");
  });

  it("fires user-invited audit once and not invite-created", async () => {
    const postConfirmNewUser = require("./../../../src/app/users/postConfirmNewUser");
    await postConfirmNewUser(req, res);

    const invitedCalls = logger.audit.mock.calls.filter(
      (c) => (c[0]?.subType || c[1]?.subType) === "user-invited",
    );
    const createdCalls = logger.audit.mock.calls.filter(
      (c) => (c[0]?.subType || c[1]?.subType) === "invite-created",
    );
    expect(invitedCalls).toHaveLength(1);
    expect(createdCalls).toHaveLength(0);
  });

  it("user-invited audit includes organisationName in metadata", async () => {
    const postConfirmNewUser = require("./../../../src/app/users/postConfirmNewUser");
    await postConfirmNewUser(req, res);

    const call = logger.audit.mock.calls.find(
      (c) => (c[0]?.subType || c[1]?.subType) === "user-invited",
    );
    const meta = call[1] || call[0];
    expect(meta.organisationName).toBe("Test School");
  });
});
