jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/serviceMapping');
jest.mock('./../../../src/infrastructure/audit');

const { getUserDetails } = require('./../../../src/app/users/utils');
const { sendResult } = require('./../../../src/infrastructure/utils');

const getAssignDigipass = require('./../../../src/app/users/getAssignDigipass');

describe('when getting assign digipass token for user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      session: {

      },
      params: {
        uid: 'abc123',
      }
    };

    res = {
      render: jest.fn(),
      status: jest.fn(),
      send: jest.fn(),
      redirect: jest.fn(),
    };
    res.render.mockReturnValue(res);
    res.status.mockReturnValue(res);

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    sendResult.mockReset();

  });

  it('then if no k2sUSer is in the session and no uid param you are redirected to the search page ', async () => {
    req.params.uid = '';

    await getAssignDigipass(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
  });

  it('then it should send result using getAssignDigipass view', async () => {
    await getAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
  });

  it('then it should include csrf token in model', async () => {
    await getAssignDigipass(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include user details in model', async () => {
    await getAssignDigipass(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        id: 'user1'
      },
    });
  });

  it('then it should get user details if there is no k2suser', async () => {
    await getAssignDigipass(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
  });

});
