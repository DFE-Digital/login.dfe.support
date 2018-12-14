jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

jest.mock('./../../../src/infrastructure/access', () => {
  return {
    addInvitationService: jest.fn(),
    addUserService: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require('./../../utils');
const { addUserService, addInvitationService } = require('./../../../src/infrastructure/access');
const logger = require('./../../../src/infrastructure/logger');
const res = getResponseMock();

describe('when adding new services to a user', () => {
  let req;
  let postConfirmAddService;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        orgId: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
        sid: 'service1',
      },
      session: {
        user: {
          email: 'test@test.com',
          firstName: 'test',
          lastName: 'name',
          services: [
            {
              serviceId: 'service1',
              name: 'service1',
              roles: [],
            }
          ]
        },
      },
    });
    res.mockResetAll();
    addInvitationService.mockReset();
    addUserService.mockReset();

    postConfirmAddService = require('./../../../src/app/users/confirmAddService').post;
  });

  it('then it should redirect to user details if no user in session', async () => {
    req.session.user = null;
    await postConfirmAddService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/organisations`);
  });

  it('then it should add services to invitation for organisation if req for invitation', async () => {
    req.params.uid = 'inv-invite1';
    await postConfirmAddService(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(addInvitationService.mock.calls[0][1]).toBe('service1');
    expect(addInvitationService.mock.calls[0][2]).toBe('88a1ed39-5a98-43da-b66e-78e564ea72b0');
    expect(addInvitationService.mock.calls[0][3]).toEqual([]);
    expect(addInvitationService.mock.calls[0][4]).toEqual([]);
    expect(addInvitationService.mock.calls[0][5]).toBe('correlationId');
  });

  it('then it should add services to user if req for user', async () => {
    req.params.uid = 'user1';
    await postConfirmAddService(req, res);

    expect(addUserService.mock.calls).toHaveLength(1);
    expect(addUserService.mock.calls[0][0]).toBe('user1');
    expect(addUserService.mock.calls[0][1]).toBe('service1');
    expect(addUserService.mock.calls[0][2]).toBe('88a1ed39-5a98-43da-b66e-78e564ea72b0');
    expect(addUserService.mock.calls[0][3]).toEqual([]);
    expect(addUserService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should should audit adding services to an existing user if isAddService is true', async () => {
    req.session.user.isAddService = true;
    await postConfirmAddService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('super.user@unit.test (id: suser1) added services for organisation id: 88a1ed39-5a98-43da-b66e-78e564ea72b0 for user test@test.com (id: user1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'approver',
      subType: 'user-services-added',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: req.params.uid,
      editedFields: [{
        name: 'add_services',
        newValue: req.session.user.services,
      }],
    });
  });

  it('then it should should audit editing a service if isAddService is false', async () => {
    await postConfirmAddService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('super.user@unit.test (id: suser1) updated service service1 for organisation id: 88a1ed39-5a98-43da-b66e-78e564ea72b0) for user test@test.com (id: user1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'approver',
      subType: 'user-service-updated',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: req.params.uid,
      editedFields: [{
        name: 'update_service',
        newValue: req.session.user.services,
      }],
    });
  });

  it('then it should redirect to services tab', async () => {
    await postConfirmAddService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/services`);
  });

  it('then a flash message is displayed showing services have been added if isAddService is true', async () => {
    req.session.user.isAddService = true;
    await postConfirmAddService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`Services successfully added`)
  });

  it('then a flash message is displayed showing service has been edited if isAddService is false', async () => {
    await postConfirmAddService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`${req.session.user.services[0].name} updated successfully`)
  });

});
