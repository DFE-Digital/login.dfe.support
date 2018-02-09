jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  serviceMapping: {
    key2SuccessServiceId: 'key-to-success-service-id'
  }
}));
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/directories');

const { getAllOrganisations, getServiceIdentifierDetails } = require('./../../../src/infrastructure/organisations');
const { getUser } = require('./../../../src/infrastructure/directories');
const postNewUserK2S = require('./../../../src/app/users/postNewUserK2S');

describe('when handling post of new key-to-success user details', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      params: {
        uid: '915a7382-576b-4699-ad07-a9fd329d3867',
      },
      body: {
        firstName: 'User',
        lastName: 'One',
        email: 'user.one@unit.test',
        localAuthority: 'org1',
        k2sId: '1234567'
      },
      user: {
        sub: 'suser1',
        email: 'super.user@unit.test',
      },
      session: {},
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    getAllOrganisations.mockReset();
    getAllOrganisations.mockReturnValue([
      { id: 'org1', name: 'org one' },
      { id: 'org2', name: 'org two' },
      { id: 'org3', name: 'org three' },
    ]);

    getServiceIdentifierDetails.mockReset();
    getServiceIdentifierDetails.mockReturnValue(null);

    getUser.mockReset();
    getUser.mockReturnValue(null);
  });

  it('then it should render view with error if required data missing', async () => {
    req.body.firstName = '';
    req.body.lastName = '';
    req.body.email = '';
    req.body.localAuthority = '';
    req.body.k2sId = '';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        firstName: 'First name is required',
        lastName: 'Last name is required',
        email: 'Email address is required',
        localAuthority: 'Local authority is required',
        k2sId: 'Key to Success ID is required',
      }
    });
  });

  it('then it should render view with error if local authority not in available orgs', async () => {
    req.body.localAuthority = 'no-such-org';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      k2sId: req.body.k2sId,
      validationMessages: {
        localAuthority: 'Invalid local authority value'
      }
    });
  });

  it('then it should render view with error if email is not a valid format', async () => {
    req.body.email = 'not-an-email-address';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      email: req.body.email,
      validationMessages: {
        email: 'Email address must be in a valid format'
      }
    });
  });

  it('then it should render view with error if email already exists in system', async () => {
    getUser.mockReturnValue({ sub: 'user1' });

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      email: req.body.email,
      validationMessages: {
        email: 'User already exists with this email address'
      }
    });
  });

  it('then it should render view with error if key-to-success id is not numeric', async () => {
    req.body.k2sId = 'abcdefg';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      k2sId: req.body.k2sId,
      validationMessages: {
        k2sId: 'Key to Success ID should be 7 numbers'
      }
    });
  });

  it('then it should render view with error if key-to-success id is shorter than 7', async () => {
    req.body.k2sId = '123456';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      k2sId: req.body.k2sId,
      validationMessages: {
        k2sId: 'Key to Success ID should be 7 numbers'
      }
    });
  });

  it('then it should render view with error if key-to-success id is longer than 7', async () => {
    req.body.k2sId = '12345678';

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      k2sId: req.body.k2sId,
      validationMessages: {
        k2sId: 'Key to Success ID should be 7 numbers'
      }
    });
  });

  it('then it should render view with error if key-to-success id is already in use', async () => {
    getServiceIdentifierDetails.mockReturnValue({
      userId: 'user-1',
      serviceId: 'service-1',
      organisationId: 'organisation-1',
      key: 'k2s-id',
      value: '1234567'
    });

    await postNewUserK2S(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/newUserK2S');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      k2sId: req.body.k2sId,
      validationMessages: {
        k2sId: 'User already exists with this Key to Success ID'
      }
    });

    expect(getServiceIdentifierDetails.mock.calls).toHaveLength(1);
    expect(getServiceIdentifierDetails.mock.calls[0][0]).toBe('key-to-success-service-id');
    expect(getServiceIdentifierDetails.mock.calls[0][1]).toBe('k2s-id');
    expect(getServiceIdentifierDetails.mock.calls[0][2]).toBe(req.body.k2sId);
    expect(getServiceIdentifierDetails.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should store user details in session', async () => {
    await postNewUserK2S(req, res);

    expect(req.session.k2sUser).not.toBeNull();
    expect(req.session.k2sUser).toMatchObject({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      localAuthority: req.body.localAuthority,
      k2sId: req.body.k2sId,
    });
  });

  it('then it should redirect to digipass page', async () => {
    await postNewUserK2S(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('assign-digipass');
  });
});
