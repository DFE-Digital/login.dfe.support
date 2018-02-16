jest.mock('./../../../src/app/userDevices/utils', () => {
  return {
    resyncToken: jest.fn().mockReturnValue(
      {
       validationResult:{
         messages:{
         }
       }
      }
    ),
  };
});

const post = require('./../../../src/app/userDevices/postResyncToken');

describe('When processing a get to search for user devices', () => {
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

    utils.resyncToken.mockReset();
    utils.resyncToken.mockReturnValue(
      {
        validationResult:{
          messages:{
          }
        }
      });

  });
  it('then it should call the resync function with the body parameters', async () => {
    await post(req, res);

    expect(utils.resyncToken.mock.calls).toHaveLength(1);
    expect(utils.resyncToken.mock.calls[0][0]).toBe(req);
  });
  it('then it should redirect to userdevices if the result is true', async () => {
    utils.resyncToken.mockReturnValue(
      {
        success: true,
        validationResult:{
          messages:{
          }
        }
      }
    );

    await post(req,res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe('Resync complete - Please ask the user to sign in to check the token is synced with the system');
    expect(res.redirect.mock.calls[0][0]).toBe('userDevices/123456/test');
  });

  test('then it should render the resync token view if the resync result is false', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/resyncToken');
  });

});