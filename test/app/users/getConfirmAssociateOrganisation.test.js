jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { addInvitationOrganisation } = require('./../../../src/infrastructure/organisations');
const getConfirmAssociateOrganisation = require('./../../../src/app/users/getConfirmAssociateOrganisation');

const res = getResponseMock();

describe('when confirming new organisation association', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
      },
      session: {
        user: {
          organisationId: 'org1',
          organisationName: 'Organisation One',
          permission: 10000,
        },
      },
    });

    res.mockResetAll();

    addInvitationOrganisation.mockReset();
  });

  it('then it should add org to invitation if request for invitation', async () => {
    req.params.uid = 'inv-user1';

    await getConfirmAssociateOrganisation(req, res);

    expect(addInvitationOrganisation.mock.calls).toHaveLength(1);
    expect(addInvitationOrganisation.mock.calls[0][0]).toBe('user1');
    expect(addInvitationOrganisation.mock.calls[0][1]).toBe('org1');
    expect(addInvitationOrganisation.mock.calls[0][2]).toBe(10000);
    expect(addInvitationOrganisation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should redirect back to users profile view', async () => {
    await getConfirmAssociateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/users/user1/services');
  });
});
