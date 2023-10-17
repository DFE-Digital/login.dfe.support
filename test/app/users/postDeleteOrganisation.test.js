jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations', () => ({
  deleteInvitationOrganisation: jest.fn(),
  deleteUserOrganisation: jest.fn(),
  getUserOrganisations: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/search');

jest.mock('login.dfe.notifications.client');
const notificationClient = require('login.dfe.notifications.client');
const { getRequestMock, getResponseMock } = require('../../utils');
const postDeleteOrganisation = require('../../../src/app/users/postDeleteOrganisation');
const { deleteInvitationOrganisation, deleteUserOrganisation, getUserOrganisations } = require('../../../src/infrastructure/organisations');
const { getSearchDetailsForUserById } = require('../../../src/infrastructure/search');

const res = getResponseMock();

describe('when removing a users access to an organisation', () => {
  let req;
  const expectedEmailAddress = 'logan@x-men.test';
  const expectedFirstName = 'James';
  const expectedLastName = 'Howlett';
  const expectedOrgName = 'X-Men';

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        id: 'org1',
      },
      session: {
        user: {
          firstName: expectedFirstName,
          lastName: expectedLastName,
          email: expectedEmailAddress,
        },
        org: {
          organisationId: 'org1',
          name: expectedOrgName,
        },
      },
    });
    res.mockResetAll();
    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [
        {
          id: 'org1',
          name: 'organisationId',
          categoryId: '004',
          statusId: 1,
          roleId: 0,
        },
      ],
    });
    getUserOrganisations.mockReturnValue([
      {
        numericIdentifier: '1111',
        textIdentifier: 'rpssss',
        organisation: { id: 'test-org-id' },
      },
    ]);
    sendUserRemovedFromOrganisationStub = jest.fn();
    notificationClient.mockReset().mockImplementation(() => ({
      sendUserRemovedFromOrganisation: sendUserRemovedFromOrganisationStub,
    }));
  });

  it('then it should delete org for invitation if request for invitation', async () => {
    req.params.uid = 'inv-invite1';

    await postDeleteOrganisation(req, res);
    await getUserOrganisations.mockReset();

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

  it('then it should send an email notification to user', async () => {
    await postDeleteOrganisation(req, res);

    expect(sendUserRemovedFromOrganisationStub.mock.calls).toHaveLength(1);

    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendUserRemovedFromOrganisationStub.mock.calls[0][3]).toBe(expectedOrgName);
  });
});
