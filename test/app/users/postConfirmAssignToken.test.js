jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/devices');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/app/users/utils');

const { getRequestMock, getResponseMock } = require('./../../utils');
const postConfirmAssignToken = require('./../../../src/app/users/postConfirmAssignToken');
const utils = require('./../../../src/app/users/utils');

describe('When confirming assign digipass to user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        serialNumber: '12-1234567-1',
        userId: '123EDC'
      },
    });

    res = getResponseMock();

    utils.createDevice.mockReset();
    utils.createDevice.mockReturnValue(true);
  });

  it('then it should redirect to user list if no user in body params', async () => {
    req.body.serialNumber = undefined;
    req.body.userId = undefined;

    await postConfirmAssignToken(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.render.mock.calls).toHaveLength(0);
  });


  it('then it should redirect to user with a flash message if successful', async () => {
    await postConfirmAssignToken(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/users/123EDC');
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
  });
  it('then it will call the createDevice for the user', async () => {
    await postConfirmAssignToken(req, res);

    expect(utils.createDevice.mock.calls).toHaveLength(1);
    expect(utils.createDevice.mock.calls[0][0]).toBe(req);
  });
});
