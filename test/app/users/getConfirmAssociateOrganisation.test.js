jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/search');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { addInvitationOrganisation, getOrganisationById, getPendingRequestsAssociatedWithUser } = require('./../../../src/infrastructure/organisations');
const getConfirmAssociateOrganisation = require('./../../../src/app/users/getConfirmAssociateOrganisation');
const { getSearchDetailsForUserById } = require('./../../../src/infrastructure/search');

jest.mock('login.dfe.jobs-client');
const { NotificationClient } = require('login.dfe.jobs-client');

const res = getResponseMock();

describe('when confirming new organisation association', () => {
  let req;
  const expectedEmailAddress = 'test@test.com';
  const expectedFirstName = 'test';
  const expectedLastName = 'name';
  const expectedOrgName = 'Organisation One';

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
      },
      session: {
        user: {
          email: expectedEmailAddress,
          firstName: expectedFirstName,
          lastName: expectedLastName,
          organisationId: 'org1',
          organisationName: 'Organisation One',
          permission: 10000,
        },
      },
    });
    getOrganisationById.mockReset();
    getOrganisationById.mockReturnValue({
      'id': "orgid",
      "name": 'orgname',
      'Category': "010",
      'Status': 1,
    });
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
    getPendingRequestsAssociatedWithUser.mockReset();
    getPendingRequestsAssociatedWithUser.mockReturnValue([{
      id: 'requestId',
      org_id: 'organisationId',
      org_name: 'organisationName',
      user_id: 'user2',
      status: {
        id: 0,
        name: 'pending',
      },
      created_date: '2019-08-12',
    }]);
    res.mockResetAll();

    addInvitationOrganisation.mockReset();

    sendUserAddedToOrganisationStub = jest.fn();
    NotificationClient.mockReset().mockImplementation(() => ({
      sendUserAddedToOrganisation: sendUserAddedToOrganisationStub,
    }));
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

  it('then it should get the users pending requests', async () => {
    await getConfirmAssociateOrganisation(req, res);

    expect(getPendingRequestsAssociatedWithUser.mock.calls).toHaveLength(1);
    expect(getPendingRequestsAssociatedWithUser.mock.calls[0][0]).toBe('user1');
    expect(getPendingRequestsAssociatedWithUser.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should redirect back to users profile view', async () => {
    await getConfirmAssociateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/users/user1/services');
  });

  it('then it should send an email notification to user', async () => {
    await getConfirmAssociateOrganisation(req, res);

    expect(sendUserAddedToOrganisationStub.mock.calls).toHaveLength(1);

    expect(sendUserAddedToOrganisationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendUserAddedToOrganisationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendUserAddedToOrganisationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendUserAddedToOrganisationStub.mock.calls[0][3]).toBe(expectedOrgName);
  
  });
});
