jest.mock('./../../../src/app/userDevices/utils', () => {
  return {
    unlockToken: jest.fn().mockReturnValue(
      {
       validationResult:{
         messages:{
         }
       }
      }
    ),
  };
});

const post = require('./../../../src/app/userDevices/postUnlockToken');

describe('When processing a post to unlock a user device', () => {
  let req;
  let res;
  let utils;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        uid: 'test',
        serialNumber: '123456',
        code1: '1234568',
        code2: '12345678'
      },
      csrfToken: () => {
        return 'token';
      },
      accepts: () => {
        return ['text/html'];
      },
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
    };

    utils = require('./../../../src/app/userDevices/utils');

    utils.unlockToken.mockReset();
    utils.unlockToken.mockReturnValue(
      {
        validationResult:{
          messages:{
          }
        }
      });

  });
  it('then it should call the unlock function with the body parameters', async () => {
    await post(req, res);

    expect(utils.unlockToken.mock.calls).toHaveLength(1);
    expect(utils.unlockToken.mock.calls[0][0]).toBe(req);
  });
  it('then it should redirect to unlock code result if the result is true', async () => {
    utils.unlockToken.mockReturnValue(
      {
        success: true,
        code: '123457',
          validationResult:{
          messages:{
          }
        }
      }
    );

    await post(req,res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/unlockTokenCode');
  });

  test('then it should render the unlock token view if the unlocktoken result is false', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/unlockToken');
  });

  it('then it redirects to the deactivate flow if the option is selected', async () => {
    utils.unlockToken.mockReturnValue(
      {
        success: false,
        redirectToDeactivate: true,
        code: '123457',
        validationResult:{
          messages:{
          }
        }
      }
    );

    await post(req,res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/userDevices/123456/deactivate/test');
  })
});