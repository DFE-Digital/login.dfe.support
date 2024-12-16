const { getRequestMock } = require('../../utils');
const postBulkUserActions = require('../../../src/app/users/postBulkUserActions');

describe('When processing a post for the bulk user actions request', () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        emails: 'test@test.com,exampleUser@example.com',
      },
    });

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
    };
  });

  it('redirects to the bulk-user-actions/email page on success', async () => {
    await postBulkUserActions(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('bulk-user-actions/emails');
    expect(req.session).toMatchObject({ emails: 'test@test.com,exampleUser@example.com' });
  });

  it('renders the page with an error when no emails are supplied', async () => {
    const testReq = getRequestMock({
      body: {
        emails: '',
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/bulkUserActions');
    expect(res.render.mock.calls[0][1]).toMatchObject(
      {
        csrfToken: 'token',
        emails: '',
        validationMessages: { emails: 'Please enter an email address' },
      },
    );
  });

  it('renders the page with an error when one of the emails is not a valid email', async () => {
    const testReq = getRequestMock({
      body: {
        emails: 'test@test.com,example@example@blah.com',
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/bulkUserActions');
    expect(res.render.mock.calls[0][1]).toMatchObject(
      {
        csrfToken: 'token',
        emails: 'test@test.com,example@example@blah.com',
        validationMessages: { emails: 'Please enter a valid email address for example@example@blah.com' },
      },
    );
  });

  it('renders the page with an error if there are more than 100 emails provided', async () => {
    let overOneHundredEmails = '';
    for (let i = 0; i <= 101; i += 1) {
      overOneHundredEmails = overOneHundredEmails.concat(`email${i}@test.com,`);
    }
    // Strip trailing comma
    overOneHundredEmails = overOneHundredEmails.replace(/,$/, '');
    const testReq = getRequestMock({
      body: {
        emails: overOneHundredEmails,
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/bulkUserActions');
    expect(res.render.mock.calls[0][1]).toMatchObject(
      {
        csrfToken: 'token',
        emails: overOneHundredEmails,
        validationMessages: { emails: 'A maximum of 100 emails can be provided' },
      },
    );
  });

  it('removes newline characters and extra spaces around the emails', async () => {
    const testReq = getRequestMock({
      body: {
        emails: 'test@test.com,  example@blah.com  ,&#13;&#10;thirdExample@testing.com',
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('bulk-user-actions/emails');
    expect(testReq.session).toMatchObject({ emails: 'test@test.com,example@blah.com,thirdExample@testing.com' });
  });

  it('removes a trailing comma from the list of emails', async () => {
    const testReq = getRequestMock({
      body: {
        emails: 'test@test.com,example@blah.com,thirdExample@testing.com,',
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('bulk-user-actions/emails');
    expect(testReq.session).toMatchObject({ emails: 'test@test.com,example@blah.com,thirdExample@testing.com' });
  });

  it('removes duplicate emails', async () => {
    const testReq = getRequestMock({
      body: {
        emails: 'test@test.com,test@test.com,example@blah.com',
      },
    });
    await postBulkUserActions(testReq, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('bulk-user-actions/emails');
    expect(testReq.session).toMatchObject({ emails: 'test@test.com,example@blah.com' });
  });
});
