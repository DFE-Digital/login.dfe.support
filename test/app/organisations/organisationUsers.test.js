jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("../../../src/app/users/userSearchHelpers/searchAndMapUsers");
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("./../../utils");
const { sendResult } = require("./../../../src/infrastructure/utils");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const organisationUsers = require("./../../../src/app/organisations/organisationUsers");
const {
  searchAndMapUsers,
} = require("../../../src/app/users/userSearchHelpers/searchAndMapUsers");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };
const usersResult = {
  users: [
    {
      id: "user-1",
      lastLogin: new Date("2024-05-17T11:29:28.133Z"),
      organisations: [
        {
          id: "org-0",
          roleId: 10000,
        },
        {
          id: "org-1",
          roleId: 1,
        },
      ],
    },
  ],
  numberOfPages: 2,
  totalNumberOfResults: 10,
};

describe("when displaying organisation users", () => {
  beforeEach(() => {
    getOrganisationRaw.mockReset().mockReturnValue(orgResult);

    searchAndMapUsers.mockReset().mockReturnValue(usersResult);
  });

  [
    { method: "POST", dataLocation: "body", action: organisationUsers.post },
    { method: "GET", dataLocation: "query", action: organisationUsers.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of organisation users (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(sendResult).toHaveBeenCalledTimes(1);
      expect(sendResult).toHaveBeenCalledWith(
        req,
        res,
        "organisations/views/users",
        {
          backLink: "/organisations",
          csrfToken: req.csrfToken(),
          currentPage: "organisations",
          layout: "sharedViews/layout.ejs",
          organisation: orgResult,
          page: 2,
          users: [
            {
              id: "user-1",
              lastLogin: new Date("2024-05-17T11:29:28.133Z"),
              formattedLastLogin: "17 May 2024",
              organisations: [
                {
                  id: "org-0",
                  roleId: 10000,
                },
                {
                  id: "org-1",
                  roleId: 1,
                },
              ],
              organisation: {
                id: "org-1",
                roleId: 1,
                role: {
                  id: 0,
                  description: "End user",
                },
              },
            },
          ],
          numberOfPages: usersResult.numberOfPages,
          totalNumberOfResults: usersResult.totalNumberOfResults,
        },
      );
    });

    it(`then it should request all users of organisation on selected page if specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(searchAndMapUsers).toHaveBeenCalledTimes(1);
      expect(searchAndMapUsers).toHaveBeenCalledWith({
        criteria: "*",
        filterBy: { organisationIds: ["org-1"] },
        pageNumber: 2,
      });
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
      });
      req[dataLocation] = {
        page: undefined,
      };

      await action(req, res);

      expect(searchAndMapUsers).toHaveBeenCalledTimes(1);
      expect(searchAndMapUsers).toHaveBeenCalledWith({
        criteria: "*",
        filterBy: { organisationIds: ["org-1"] },
        pageNumber: 1,
      });
    });

    it(`then it should request current organisation details (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
      });

      await action(req, res);

      expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
      expect(getOrganisationRaw).toHaveBeenCalledWith({
        by: { organisationId: "org-1" },
      });
    });
  });
});
