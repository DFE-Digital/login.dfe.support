jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { searchOrganisations } = require('./../../../src/infrastructure/organisations');
const search = require('./../../../src/app/organisations/search');

const res = getResponseMock();
const orgsResult = {
  organisations: [
    { id: 'org-1', name: 'organisation one'},
    { id: 'org-2', name: 'organisation two'},
  ],
  totalNumberOfPages: 10,
  totalNumberOfResults: 99,
  organisationStatuses: [],
  organisationTypes: [],
};

describe('when searching for organisations', () => {
  beforeEach(() => {
    searchOrganisations.mockReset().mockReturnValue(orgsResult);
  });

  [
    { method: 'POST', dataLocation: 'body', action: search.post },
    { method: 'GET', dataLocation: 'query', action: search.get },
  ].forEach(({ method, dataLocation, action }) => {

    it(`then it should send page of organisations (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

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
      });
    });

    it(`then it should search orgs with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', [],[], 2, req.id);
    });

    it(`then it should search orgs with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
      });
      req[dataLocation] = {
        criteria: undefined,
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('', [],[], 2, req.id);
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: undefined,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', [],[], 1, req.id);
    });

  });

});
