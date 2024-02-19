jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/organisations');

jest.mock('login.dfe.dao', () => ({
  organisation: {
    getPpAudit: jest.fn().mockReturnValue(
      [{ statusStep1: 2 }],
    ),
  },
}));

const { getRequestMock, getResponseMock } = require('../../utils');
const { sendResult } = require('../../../src/infrastructure/utils');
const { searchOrganisations } = require('../../../src/infrastructure/organisations');
const search = require('../../../src/app/organisations/search');

const res = getResponseMock();
const orgsResult = {
  organisations: [
    { id: 'org-1', name: 'organisation one' },
    { id: 'org-2', name: 'organisation two' },
  ],
  totalNumberOfPages: 10,
  totalNumberOfResults: 99,
  organisationStatuses: [],
  organisationTypes: [],
};

let requestConfig;
let req;

describe('when searching for organisations', () => {
  beforeEach(() => {
    searchOrganisations.mockReset().mockReturnValue(orgsResult);
  });

  describe('when method is GET', () => {
    beforeEach(() => {
      requestConfig = { method: 'GET', dataLocation: 'query', action: search.get };
      req = getRequestMock({ method: requestConfig.method });
    });

    it('then it should not search for organisations', async () => {
      await requestConfig.action(req, res);
      expect(searchOrganisations).not.toHaveBeenCalledTimes(1);
      expect(sendResult).toHaveBeenCalledTimes(1);
      expect(sendResult).toHaveBeenCalledWith(req, res, 'organisations/views/search', {
        csrfToken: req.csrfToken(),
        criteria: undefined,
        page: undefined,
        numberOfPages: undefined,
        totalNumberOfResults: undefined,
        organisations: undefined,
        organisationTypes: [],
        organisationStatuses: [],
        showFilters: false,
        validationMessages: {},
      });
    });
  });

  describe('when method is POST', () => {
    beforeEach(() => {
      requestConfig = { method: 'POST', dataLocation: 'body', action: search.post };
      req = getRequestMock({ method: requestConfig.method });
    });

    describe('when search criteria is >= 4 characters', () => {
      beforeEach(() => {
        req[requestConfig.dataLocation] = {
          criteria: 'org1',
          page: 2,
        };
      });

      it('then it should send page of organisations', async () => {
        await requestConfig.action(req, res);

        expect(sendResult).toHaveBeenCalledTimes(1);
        expect(sendResult).toHaveBeenCalledWith(req, res, 'organisations/views/search', {
          csrfToken: req.csrfToken(),
          criteria: 'org1',
          page: 2,
          numberOfPages: orgsResult.totalNumberOfPages,
          totalNumberOfResults: orgsResult.totalNumberOfRecords,
          organisations: orgsResult.organisations,
          organisationTypes: orgsResult.organisationTypes,
          organisationStatuses: orgsResult.organisationStatuses,
          showFilters: false,
          validationMessages: {},
        });
      });

      it('then it should search orgs with criteria specified', async () => {
        await requestConfig.action(req, res);

        expect(searchOrganisations).toHaveBeenCalledTimes(1);
        expect(searchOrganisations).toHaveBeenCalledWith('org1', [], [], 2, req.id);
      });

      it('then it should request page 1 if no page specified', async () => {
        req[requestConfig.dataLocation].page = undefined;

        await requestConfig.action(req, res);

        expect(searchOrganisations).toHaveBeenCalledTimes(1);
        expect(searchOrganisations).toHaveBeenCalledWith('org1', [], [], 1, req.id);
      });
    });

    describe('when search criteria is >= 4 characters', () => {
      beforeEach(() => {
        req[requestConfig.dataLocation] = {
          criteria: 'a',
        };
      });

      it('then it should not search orgs and return validation error', async () => {
        await requestConfig.action(req, res);

        expect(searchOrganisations).not.toHaveBeenCalledTimes(1);
        expect(sendResult).toHaveBeenCalledWith(req, res, 'organisations/views/search', {
          csrfToken: req.csrfToken(),
          criteria: undefined,
          page: undefined,
          numberOfPages: undefined,
          totalNumberOfResults: undefined,
          organisations: undefined,
          organisationTypes: [],
          organisationStatuses: [],
          showFilters: false,
          validationMessages: {
            criteria: 'Please enter at least 4 characters',
          },
        });
      });
    });
  });
});
