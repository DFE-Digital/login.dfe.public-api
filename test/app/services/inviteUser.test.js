jest.mock('uuid/v4');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('jsonwebtoken');

const { mockRequest, mockResponse } = require('./../../utils');
const inviteUser = require('./../../../src/app/services/inviteUser');

const res = mockResponse();

describe('When inviting a user', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      params: {
        sid: 'da03ea7a-6c5b-4864-be53-2eaccf63bec4',
      },
      body: {
        sourceId: 'client-user-id',
        given_name: 'User',
        family_name: 'One',
        email: 'user.one@unit.tests',
        organisation: 'org1',
        callback: 'https://some.url/user/created',
        userRedirect: 'https://another.url/signup/complete'
      },
    });

    res.mockResetAll();
  });

  it('then it should return 202 status code if request ok', async () => {
    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 202 status code organisation is omitted', async () => {
    req.body.organisation = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 202 status code userRedirect is omitted', async () => {
    req.body.userRedirect = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 404 result if service not found', async () => {
    req.params.sid = 'wrong-id';

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 400 result if sourceId omitted', async () => {
    req.body.sourceId = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['Missing sourceId']
    });
  });

  it('then it should return 400 result if given_name omitted', async () => {
    req.body.given_name = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['Missing given_name']
    });
  });

  it('then it should return 400 result if family_name omitted', async () => {
    req.body.family_name = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['Missing family_name']
    });
  });

  it('then it should return 400 result if email omitted', async () => {
    req.body.email = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['Missing email']
    });
  });

  it('then it should return 400 result if callback omitted', async () => {
    req.body.callback = undefined;

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['Missing callback']
    });
  });

  it('then it should return 400 result if email not a valid email address', async () => {
    req.body.email = 'not-an-email-address';

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['email is not a valid email address']
    });
  });

  it('then it should return 400 result if callback not a valid http(s) uri', async () => {
    req.body.callback = 'ftp://not-valid';

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['callback must be a valid, fully qualified, http(s) URI']
    });
  });

  it('then it should return 400 result if userRedirect not a valid http(s) uri', async () => {
    req.body.userRedirect = 'ftp://not-valid';

    await inviteUser(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual({
      errors: ['userRedirect must be a valid, fully qualified, http(s) URI']
    });
  });
});