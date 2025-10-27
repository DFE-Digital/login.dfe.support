jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/users");
jest.mock(
  "../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById",
);

const { getInvitationRaw } = require("login.dfe.api-client/invitations");
const {
  getUserRaw,
  getUserServicesRaw,
} = require("login.dfe.api-client/users");
const { getUserDetailsById } = require("../../../src/app/users/utils");
const {
  getSearchDetailsForUserById,
} = require("../../../src/app/users/userSearchHelpers/getSearchDetailsForUserById");

describe("When using the getUserDetailsById function", () => {
  describe("When getting user details for an invited user", () => {
    let req;

    beforeEach(() => {
      getInvitationRaw.mockReset().mockReturnValue({
        id: "inv-user1",
        name: "Albus Dumbledore",
        firstName: "Albus",
        lastName: "Dumbledore",
        email: "headmaster@hogwarts.com",
        deactivated: false,
        organisation: null,
        lastLogin: null,
        successfulLoginsInPast12Months: 0,
      });

      req = {
        params: {
          uid: "inv-user1",
        },
        externalAuth: {
          getEntraAccountIdByEmail: jest.fn(),
        },
      };
    });

    it("then it should return an object when getInvitationRaw returns a record", async () => {
      const result = await getUserDetailsById(req.params.uid, req);

      expect(result).toMatchObject({
        id: "inv-user1",
        name: "Albus Dumbledore",
        firstName: "Albus",
        lastName: "Dumbledore",
        email: "headmaster@hogwarts.com",
        lastLogin: null,
        status: { id: -1, description: "Invited", changedOn: null },
        loginsInPast12Months: {
          successful: 0,
        },
        deactivated: false,
      });

      expect(getInvitationRaw.mock.calls).toHaveLength(1);
      expect(getInvitationRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
    });
  });

  describe("When getting user details for a user", () => {
    let req;

    const getUserRawData = {
      sub: "user1",
      given_name: "Albus",
      family_name: "Dumbledore",
      email: "headmaster@hogwarts.com",
      job_title: null,
      status: 1,
      phone_number: null,
      last_login: "2025-10-02T15:01:04.793Z",
      prev_login: "2025-08-04T13:03:32.890Z",
      isEntra: true,
      entraOid: "entra-id-from-database",
      entraLinked: "2025-08-03T12:00:00.000Z",
      isInternalUser: false,
      entraDeferUntil: null,
    };

    beforeEach(() => {
      getSearchDetailsForUserById.mockReset();
      getSearchDetailsForUserById.mockReturnValue({
        id: "user-1",
        name: "Adam Mann",
        firstName: "Adam",
        lastName: "Mann",
        email: "adam.mann+1@education.gov.uk",
        organisation: {
          name: "ASP Test Diocese CE24 Unnamed",
        },
        organisations: [
          {
            id: "org1",
            name: "organisationId",
            urn: "402050",
            ukprn: "10001153",
            categoryId: "004",
            statusId: 1,
            roleId: 0,
          },
        ],
        lastLogin: "2025-10-02T15:01:04.793Z",
        successfulLoginsInPast12Months: null,
        status: {
          id: 1,
          description: "Active",
          changedOn: null,
        },
        pendingEmail: null,
      });

      getUserRaw.mockReset().mockReturnValue(getUserRawData);

      getUserServicesRaw.mockReset().mockReturnValue([
        {
          userId: "user-1",
          serviceId: "service1Id",
          organisationId: "organisation-1",
          roles: [],
          identifiers: [],
          accessGrantedOn: "2025-06-20T11:50:26Z",
        },
        {
          userId: "user-1",
          serviceId: "service2Id",
          organisationId: "organisation-1",
          roles: [],
          identifiers: [],
          accessGrantedOn: "2025-06-20T11:50:26Z",
        },
      ]);

      req = {
        params: {
          uid: "user1",
        },
        externalAuth: {
          getEntraAccountIdByEmail: jest
            .fn()
            .mockReset()
            .mockReturnValue("entra-id-from-entra"),
        },
      };
    });

    it("then it should return an object when getUserRaw returns a record and the user has moved to entra", async () => {
      const result = await getUserDetailsById(req.params.uid, req);

      expect(result).toMatchObject({
        id: "user1",
        name: "Albus Dumbledore",
        firstName: "Albus",
        lastName: "Dumbledore",
        email: "headmaster@hogwarts.com",
        isEntra: true,
        isInternalUser: false,
        entraOid: "entra-id-from-database",
        entraLinked: "03 Aug 2025 01:00pm",
        entraDeferUntil: null,
        lastLogin: new Date("2025-10-02T15:01:04.793Z"),
        status: { id: 1, description: "Active", changedOn: null },
        loginsInPast12Months: { successful: undefined },
        pendingEmail: null,
        serviceDetails: [
          {
            userId: "user-1",
            serviceId: "service1Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
          {
            userId: "user-1",
            serviceId: "service2Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
        ],
        hasManageAccess: false,
      });

      expect(getUserRaw.mock.calls).toHaveLength(1);
      expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
    });

    it("then it should return an object when getUserRaw returns a record and user has not moved to entra", async () => {
      const getRawUserDataCopy = structuredClone(getUserRawData);
      getRawUserDataCopy.isEntra = false;
      getRawUserDataCopy.entraOid = null;
      getRawUserDataCopy.entraLinked = null;
      getUserRaw.mockReset().mockReturnValue(getRawUserDataCopy);

      const result = await getUserDetailsById(req.params.uid, req);

      expect(result).toMatchObject({
        id: "user1",
        name: "Albus Dumbledore",
        firstName: "Albus",
        lastName: "Dumbledore",
        email: "headmaster@hogwarts.com",
        isEntra: false,
        isInternalUser: false,
        entraOid: null,
        entraLinked: null,
        entraDeferUntil: null,
        lastLogin: new Date("2025-10-02T15:01:04.793Z"),
        status: { id: 1, description: "Active", changedOn: null },
        loginsInPast12Months: { successful: undefined },
        pendingEmail: null,
        serviceDetails: [
          {
            userId: "user-1",
            serviceId: "service1Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
          {
            userId: "user-1",
            serviceId: "service2Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
        ],
        hasManageAccess: false,
      });

      expect(getUserRaw.mock.calls).toHaveLength(1);
      expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
      expect(req.externalAuth.getEntraAccountIdByEmail).toHaveBeenCalledTimes(
        0,
      );
    });

    it("should set the entraOid field to the one from entra if not found in the database", async () => {
      req.externalAuth.getEntraAccountIdByEmail.mockReturnValue(
        "id-from-entra",
      );
      const getRawUserDataCopy = structuredClone(getUserRawData);
      getRawUserDataCopy.entraOid = null;
      getUserRaw.mockReset().mockReturnValue(getRawUserDataCopy);
      const result = await getUserDetailsById(req.params.uid, req);

      expect(result).toMatchObject({
        id: "user1",
        name: "Albus Dumbledore",
        firstName: "Albus",
        lastName: "Dumbledore",
        email: "headmaster@hogwarts.com",
        isEntra: true,
        isInternalUser: false,
        entraOid: "id-from-entra",
        entraLinked: "03 Aug 2025 01:00pm",
        entraDeferUntil: null,
        lastLogin: new Date("2025-10-02T15:01:04.793Z"),
        status: { id: 1, description: "Active", changedOn: null },
        loginsInPast12Months: { successful: undefined },
        pendingEmail: null,
        serviceDetails: [
          {
            userId: "user-1",
            serviceId: "service1Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
          {
            userId: "user-1",
            serviceId: "service2Id",
            organisationId: "organisation-1",
            roles: [],
            identifiers: [],
            accessGrantedOn: "2025-06-20T11:50:26Z",
          },
        ],
        hasManageAccess: false,
      });

      expect(getUserRaw.mock.calls).toHaveLength(1);
      expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
    });
  });
});
