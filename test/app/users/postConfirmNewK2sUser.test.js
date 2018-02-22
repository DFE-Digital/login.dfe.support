jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  serviceMapping: {
    key2SuccessServiceId: '1234567',
  },
}));
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { createInvite } = require('./../../../src/infrastructure/directories');
const { addInvitationService } = require('./../../../src/infrastructure/organisations');
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
    expect(createInvite.mock.calls[0][3]).toBe('1928371');
    expect(createInvite.mock.calls[0][4]).toBe('1234567890');
    expect(createInvite.mock.calls[0][5]).toBe('correlationId');
  });

  it('then it should create invite service mapping for invite in organisations', async () => {
    await postConfirmNewK2sUser(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(addInvitationService.mock.calls[0][1]).toBe('LA-1');
    expect(addInvitationService.mock.calls[0][2]).toBe('1234567');
    expect(addInvitationService.mock.calls[0][3]).toBe(0);
    expect(addInvitationService.mock.calls[0][4]).toBe('correlationId');
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
