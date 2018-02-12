jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/devices');
jest.mock('./../../../src/infrastructure/directories');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { deviceExists } = require('./../../../src/infrastructure/devices');
const { getUserAssociatedToDevice } = require('./../../../src/infrastructure/directories');
const postAssignDigipass = require('./../../../src/app/users/postAssignDigipass');

describe('When assigning digipass to user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        serialNumber: '12-1234567-1',
      },
      session: {
        k2sUser: {
          firstName: 'Eddie',
          lastName: 'Brock',
          email: 'eddie.brock@daily-bugle.test',
          localAuthority: 'nyc1',
          k2sId: '1234567',
        }
      },
    });

    res = getResponseMock();

    deviceExists.mockReset();
    deviceExists.mockReturnValue(true);

    getUserAssociatedToDevice.mockReset();
    getUserAssociatedToDevice.mockReturnValue(null);
  });

  it('then it should redirect to user list if no k2suser in session', async () => {
    req.session.k2sUser = undefined;

    await postAssignDigipass(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.render.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number is not present', async () => {
    req.body.serialNumber = undefined;

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'You must supply a token serial number',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number less than 10 in length after removing hyphens', async () => {
    req.body.serialNumber = '12-123456-1';

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'Serial number must be 10 digits (excluding hyphens)',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number more than 10 in length after removing hyphens', async () => {
    req.body.serialNumber = '12-12345678-1';

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'Serial number must be 10 digits (excluding hyphens)',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number is not numeric after removing hyphens', async () => {
    req.body.serialNumber = '12-1234567-a';

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'Serial number must be 10 digits (excluding hyphens)',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number is already assigned', async () => {
    getUserAssociatedToDevice.mockReturnValue('user1');

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'Serial number is already assigned to another user',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should render view with error if serial number does not exist', async () => {
    deviceExists.mockReturnValue(false);

    await postAssignDigipass(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/assignDigipass');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: req.session.k2sUser,
      validationMessages: {
        serialNumber: 'Serial number does not exist',
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });

  it('then it should add serial number to session', async () => {
    await postAssignDigipass(req, res);

    expect(req.session.digipassSerialNumberToAssign).toBe('1212345671');
  });

  it('then it should redirect to confirm new key to success user view', async () => {
    await postAssignDigipass(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('confirm-new-k2s-user');
  });
});
