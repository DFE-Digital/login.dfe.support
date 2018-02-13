const { getRequestMock, getResponseMock } = require('./../../utils');
const { createInvite } = require('./../../../src/infrastructure/directories');
const postConfirmNewK2sUser = require('./../../../src/app/users/postConfirmNewK2sUser');

describe('when confirming the details of a new K2S user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        k2sUser: {
          firstName: 'Eddie',
          lastName: 'Brock',
          email: 'eddie.brock@daily-bugle.test',
          localAuthority: 'LA-1',
          k2sId: '1928371'
        },
        digipassSerialNumberToAssign: '1234567890',
      },
    });

    res = getResponseMock();
  });

  it('then it should redirect to user list if session does not have user', async () => {
    req.session.k2sUser = undefined;

    await postConfirmNewK2sUser(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.flash.mock.calls).toHaveLength(0);
    //TODO: Check not calling invite infra
  });

  it('then it should redirect to user list if session does not a serial number', async () => {
    req.session.digipassSerialNumberToAssign = undefined;

    await postConfirmNewK2sUser(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.flash.mock.calls).toHaveLength(0);
    //TODO: Check not calling invite infra
  });

  it('then it should set a flash message that user has been invited and redirect to user list', async () => {
    await postConfirmNewK2sUser(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe('Eddie Brock has been invited to join Key to Success.');

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/users');
  });
});
