jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations', () => {
  return {
    deleteInvitationOrganisation: jest.fn(),
    deleteUserOrganisation: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/search');

const { getRequestMock, getResponseMock } = require('./../../utils');
const postDeleteOrganisation = require('./../../../src/app/users/postDeleteOrganisation');
const { deleteInvitationOrganisation, deleteUserOrganisation } = require('./../../../src/infrastructure/organisations');
const { getSearchDetailsForUserById } = require('./../../../src/infrastructure/search');

const res = getResponseMock();

describe('when removing a users access to an organisation', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        id: 'org1'
      },
      session: {
        user: {
          firstName: 'James',
          lastName: 'Howlett',
          email: 'logan@x-men.test',
        },
        org: {
          organisationId: 'org1',
          name: 'X-Men',
        },
      },
    });
    res.mockResetAll();
    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [
        {
          id: "org1",
          name: "organisationId",
          categoryId: "004",
          statusId: 1,
          roleId: 0
        },
      ]
    });
  });

  it('then it should delete org for invitation if request for invitation', async () => {
    req.params.uid = 'inv-invite1';

    await postDeleteOrganisation(req, res);

    expect(deleteInvitationOrganisation.mock.calls).toHaveLength(1);
    expect(deleteInvitationOrganisation.mock.calls[0][0]).toBe('invite1');
    expect(deleteInvitationOrganisation.mock.calls[0][1]).toBe('org1');
  });

  it('then it should delete org for user', async () => {

    await postDeleteOrganisation(req, res);

    expect(deleteUserOrganisation.mock.calls).toHaveLength(1);
    expect(deleteUserOrganisation.mock.calls[0][0]).toBe('user1');
    expect(deleteUserOrganisation.mock.calls[0][1]).toBe('org1');
  });

  it('then it should redirect to organisations', async () => {
    await postDeleteOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/organisations`);
  });
});
