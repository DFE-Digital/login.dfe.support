jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/access');

const { getServicesByInvitationId, removeServiceFromInvitation } = require('../../../src/infrastructure/access');
const { removeAllServicesForInvitedUser } = require('../../../src/app/users/utils');

describe('When removing all services for an invited user', () => {
  const userId = 'inv-user-id';
  let req;

  beforeEach(() => {
    getServicesByInvitationId.mockReset().mockReturnValue([{
      userId: 'inv-user-id',
      invitationId: 'invitation-id',
      serviceId: 'service-id',
      organisationId: 'organisation-id',
      roles: ['role1'],
      identifiers: [{ key: 'some', value: 'thing' }],
    }]);
    // Returns 204 on success
    removeServiceFromInvitation.mockReset().mockReturnValue(undefined);

    req = {
      id: 'correlation-id',
    };
  });

  it('then it should call removeServiceFromInvitation when a service is returned', async () => {
    await removeAllServicesForInvitedUser(userId, req);

    expect(getServicesByInvitationId.mock.calls).toHaveLength(1);
    expect(getServicesByInvitationId.mock.calls[0][0]).toBe('user-id');
    expect(removeServiceFromInvitation.mock.calls).toHaveLength(1);
  });

  it('should continue to work when getServicesByInvitationId returns undefined on a 404', async () => {
    getServicesByInvitationId.mockReset().mockReturnValue(undefined);
    await removeAllServicesForInvitedUser(userId, req);

    expect(getServicesByInvitationId.mock.calls).toHaveLength(1);
    expect(getServicesByInvitationId.mock.calls[0][0]).toBe('user-id');
    expect(removeServiceFromInvitation.mock.calls).toHaveLength(0);
  });
});
