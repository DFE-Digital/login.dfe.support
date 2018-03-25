jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/audit/cache');
jest.mock('./../../../src/infrastructure/audit');

const audit = require('./../../../src/infrastructure/audit');
const syncAuditCache = require('./../../../src/app/syncViews/syncAuditCache');

describe('when syncing audit cache', () => {
  beforeEach(() => {
    audit.cache.getDateOfLastAuditRecord.mockReset().mockReturnValue(new Date(2018, 3, 23, 12, 25, 36));

    audit.cache.update.mockReset();

    audit.cache.setDateOfLastAuditRecord.mockReset();

    audit.cache.getStatsForUser.mockReset().mockReturnValue({
      userId: 'user1',
      loginsInPast12Months: [
        { timestamp: new Date(2018, 3, 18) },
      ],
      lastLogin: new Date(2018, 3, 18),
    });

    audit.getAllAuditsSince.mockReset().mockReturnValue([]);
  });

  it('then it should get the date of the last audit record that was read', async () => {
    await syncAuditCache();

    expect(audit.cache.getDateOfLastAuditRecord.mock.calls).toHaveLength(1);
  });

  it('then it should get audits until no more are available', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }];
    const batch2 = [{
      userId: 'user2',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 25)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementationOnce(() => batch2)
      .mockImplementation(() => []);

    await syncAuditCache();

    expect(audit.getAllAuditsSince.mock.calls).toHaveLength(3);
    expect(audit.cache.getDateOfLastAuditRecord.mock.calls).toHaveLength(1);
  });

  it('then it should create updates for any audits that are sign-ins', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementation(() => []);

    await syncAuditCache();

    expect(audit.cache.update.mock.calls).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0]).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0][0]).toEqual({
      userId: 'user1',
      loginsInPast12Months: [
        { timestamp: new Date(2018, 3, 18) },
        { timestamp: new Date(2018, 3, 24) },
      ],
      lastLogin: new Date(2018, 3, 24),
    });
  });

  it('then it should create one update for a user', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }, {
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 25)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementation(() => []);

    await syncAuditCache();

    expect(audit.cache.update.mock.calls).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0]).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0][0]).toEqual({
      userId: 'user1',
      loginsInPast12Months: [
        { timestamp: new Date(2018, 3, 18) },
        { timestamp: new Date(2018, 3, 24) },
        { timestamp: new Date(2018, 3, 25) },
      ],
      lastLogin: new Date(2018, 3, 25),
    });
  });

  it('then it should update pointer to most recent audit timestamp', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }, {
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 25)
    }, {
      userId: 'user1',
      type: 'somthing-else',
      subType: 'not-signin',
      timestamp: new Date(2018, 3, 26)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementation(() => []);

    await syncAuditCache();

    expect(audit.cache.setDateOfLastAuditRecord.mock.calls).toHaveLength(1);
    expect(audit.cache.setDateOfLastAuditRecord.mock.calls[0][0]).toEqual(new Date(2018, 3, 26));
  });

  it('then it should get current stat of user for first update', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementation(() => []);

    await syncAuditCache();

    expect(audit.cache.getStatsForUser.mock.calls).toHaveLength(1);
    expect(audit.cache.getStatsForUser.mock.calls[0][0]).toBe('user1');
  });

  it('then it should create clean update for user if none in cache', async () => {
    const batch1 = [{
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 24)
    }, {
      userId: 'user1',
      type: 'sign-in',
      subType: 'username-password',
      timestamp: new Date(2018, 3, 25)
    }];
    audit.getAllAuditsSince.mockImplementationOnce(() => batch1)
      .mockImplementation(() => []);
    audit.cache.getStatsForUser.mockReturnValue(null);

    await syncAuditCache();

    expect(audit.cache.update.mock.calls).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0]).toHaveLength(1);
    expect(audit.cache.update.mock.calls[0][0][0]).toEqual({
      userId: 'user1',
      loginsInPast12Months: [
        { timestamp: new Date(2018, 3, 24) },
        { timestamp: new Date(2018, 3, 25) },
      ],
      lastLogin: new Date(2018, 3, 25),
    });
  });
});
