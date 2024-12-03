const { mapUserStatus } = require('../../../src/infrastructure/utils/mapUserStatus');

describe('when getting a users services mapping from api', () => {
  it('should return an object with an Active description on status 1', async () => {
    const result = mapUserStatus(1, '2024-01-01');
    expect(result).toMatchObject({
      changedOn: '2024-01-01',
      description: 'Active',
      id: 1,
    });
  });

  it('should return an object with an Deactivated description on status 0', async () => {
    const result = mapUserStatus(0, '2024-01-01');
    expect(result).toMatchObject({
      changedOn: '2024-01-01',
      description: 'Deactivated',
      id: 0,
    });
  });

  it('should return an object with an Invited description on status -1', async () => {
    const result = mapUserStatus(-1, '2024-01-01');
    expect(result).toMatchObject({
      changedOn: '2024-01-01',
      description: 'Invited',
      id: -1,
    });
  });

  it('should return an object with an Deactivated Invitation description on status -2', async () => {
    const result = mapUserStatus(-2, '2024-01-01');
    expect(result).toMatchObject({
      changedOn: '2024-01-01',
      description: 'Deactivated Invitation',
      id: -2,
    });
  });
});
