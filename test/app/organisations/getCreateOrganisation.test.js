jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');

const { getRequestMock, getResponseMock } = require('../../utils');
const { sendResult } = require('../../../src/infrastructure/utils');
const getCreateOrganisation = require('../../../src/app/organisations/getCreateOrganisation');

const res = getResponseMock();

describe('when displaying the get create organisations', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock();
    res.mockResetAll();
  });

  it('then it should return the create organisation view', async () => {
    await getCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(req, res, 'organisations/views/createOrganisation', {
      csrfToken: req.csrfToken(),
      backLink: true,
      currentPage: 'organisations',
      layout: 'sharedViews/layoutNew.ejs',
      validationMessages: {},
    });
  });
});
