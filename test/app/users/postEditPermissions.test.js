jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const postEditPermissions = require('./../../../src/app/users/postEditPermissions');
const { addInvitationOrganisation, setUserAccessToOrganisation } = require('./../../../src/infrastructure/organisations');

const res = getResponseMock();

describe('when editing a users permission level', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        id: 'org1'
      },
      body: {
        selectedLevel: 0,
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
  });

  it('then it should edit org permission for invitation if request for invitation', async () => {
    req.params.uid = 'inv-user1';

    await postEditPermissions(req, res);

    expect(addInvitationOrganisation.mock.calls).toHaveLength(1);
    expect(addInvitationOrganisation.mock.calls[0][0]).toBe('user1');
    expect(addInvitationOrganisation.mock.calls[0][1]).toBe('org1');
    expect(addInvitationOrganisation.mock.calls[0][2]).toBe(0);
    expect(addInvitationOrganisation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should edit org permission for user', async () => {

    await postEditPermissions(req, res);

    expect(setUserAccessToOrganisation.mock.calls).toHaveLength(1);
    expect(setUserAccessToOrganisation.mock.calls[0][0]).toBe('user1');
    expect(setUserAccessToOrganisation.mock.calls[0][1]).toBe('org1');
    expect(setUserAccessToOrganisation.mock.calls[0][2]).toBe(0);
    expect(setUserAccessToOrganisation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should redirect to organisations', async () => {
    await postEditPermissions(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/organisations`);
  });

  it('then it should display error if no level is selected', async () => {
    req.body.selectedLevel = undefined;

    await postEditPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editPermissions');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      userFullName: 'James Howlett',
      selectedLevel: undefined,
      organisationName: 'X-Men',
      validationMessages: {
        selectedLevel: 'Please select a permission level',
      },
    });
  });

  it('then it should display error if invalid level', async () => {
    req.body.selectedLevel = 999999;

    await postEditPermissions(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editPermissions');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      userFullName: 'James Howlett',
      organisationName: 'X-Men',
      selectedLevel: 999999,
      validationMessages: {
        selectedLevel: 'Please select a permission level',
      },
    });
  });
});
