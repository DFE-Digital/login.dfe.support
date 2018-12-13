jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  serviceMapping: {
    type: 'static',
    key2SuccessServiceId: '1234567',
  },
  access : {
    type: 'static'
  }
}));
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/serviceMapping');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/hotConfig');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { createInvite } = require('./../../../src/infrastructure/directories');
const { getClientIdForServiceId } = require('./../../../src/infrastructure/serviceMapping');
const { addInvitationService } = require('./../../../src/infrastructure/access');
const { getOidcClientById } = require('./../../../src/infrastructure/hotConfig');
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

    createInvite.mockReset();
    createInvite.mockReturnValue('invite1');

    addInvitationService.mockReset();

    getClientIdForServiceId.mockReset().mockReturnValue('kts-rp');

    getOidcClientById.mockReset().mockReturnValue({
      client_id: 'kts-rp',
      client_secret: 'some-secure-secret',
      redirect_uris: [
        'https://key.to.success.test',
        'https://client.one/register/complete',
      ],
      post_logout_redirect_uris: [
        'https://client.one/signout/complete',
      ],
    })
  });

  it('then it should redirect to user list if session does not have user', async () => {
    req.session.k2sUser = undefined;

    await postConfirmNewK2sUser(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.flash.mock.calls).toHaveLength(0);
    expect(createInvite.mock.calls).toHaveLength(0);
    expect(addInvitationService.mock.calls).toHaveLength(0);
  });

  it('then it should redirect to user list if session does not a serial number', async () => {
    req.session.digipassSerialNumberToAssign = undefined;

    await postConfirmNewK2sUser(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('../');
    expect(res.flash.mock.calls).toHaveLength(0);
    expect(createInvite.mock.calls).toHaveLength(0);
    expect(addInvitationService.mock.calls).toHaveLength(0);
  });

  it('then it should create invite in directories', async () => {
    await postConfirmNewK2sUser(req, res);

    expect(createInvite.mock.calls).toHaveLength(1);
    expect(createInvite.mock.calls[0][0]).toBe('Eddie');
    expect(createInvite.mock.calls[0][1]).toBe('Brock');
    expect(createInvite.mock.calls[0][2]).toBe('eddie.brock@daily-bugle.test');
    expect(createInvite.mock.calls[0][3]).toBe('1234567890');
    expect(createInvite.mock.calls[0][4]).toBe('kts-rp');
    expect(createInvite.mock.calls[0][5]).toBe('https://key.to.success.test');
    expect(createInvite.mock.calls[0][6]).toBe('correlationId');
  });

  it('then it should create invite service mapping for invite in organisations', async () => {
    await postConfirmNewK2sUser(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(addInvitationService.mock.calls[0][1]).toBe('1234567');
    expect(addInvitationService.mock.calls[0][2]).toBe('LA-1');
    expect(addInvitationService.mock.calls[0][3]).toEqual([{ key: 'k2s-id', value: '1928371' }]);
    expect(addInvitationService.mock.calls[0][4]).toEqual([]);
    expect(addInvitationService.mock.calls[0][5]).toBe('correlationId');
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
