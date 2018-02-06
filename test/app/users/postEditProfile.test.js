jest.mock('./../../../src/infrastructure/config', () => {
  return {
    directories: {
      type: 'static',
    },
    cache: {
      type: 'static',
    },
    audit: {
      type: 'static',
    },
  };
});
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/users');

const { getUserDetails } = require('./../../../src/app/users/utils');
const { updateUser } = require('./../../../src/infrastructure/directories');
const { getById, updateIndex } = require('./../../../src/infrastructure/users');
const postEditProfile = require('./../../../src/app/users/postEditProfile');

describe('when updating users profile details', () => {
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
        firstName: 'Rupert',
        lastName: 'Grint',
      },
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    getUserDetails.mockReset();

    updateUser.mockReset();

    getById.mockReset().mockReturnValue({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Bobby Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      statusDescription: 'Active'
    });

    updateIndex.mockReset();
  });

  it('then it should render view if firstName missing', async () => {
    req.body.firstName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editProfile');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        firstName: 'Must specify a first name',
      },
    });
  });

  it('then it should render view if lastName missing', async () => {
    req.body.lastName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editProfile');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        lastName: 'Must specify a last name',
      },
    });
  });

  it('then it should update user in directories', async () => {
    await postEditProfile(req, res);

    expect(updateUser.mock.calls).toHaveLength(1);
    expect(updateUser.mock.calls[0][0]).toBe('915a7382-576b-4699-ad07-a9fd329d3867');
    expect(updateUser.mock.calls[0][1]).toBe('Rupert');
    expect(updateUser.mock.calls[0][2]).toBe('Grint');
    expect(updateUser.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postEditProfile(req, res);

    expect(updateIndex.mock.calls).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0]).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      statusDescription: 'Active'
    })
  });

  it('then it should redirect to user services', async () => {
    await postEditProfile(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });
});
