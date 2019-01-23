jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('niceware');

const niceware = require('niceware');
const { mockRequest, mockResponse } = require('./../../utils');
const getNewSecret = require('./../../../src/app/services/getNewSecret');
const res = mockResponse();

describe('when getting a new secret ', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({});

    res.mockResetAll();
    niceware.generatePassphrase.mockReset().mockReturnValue(['password', 'password2']);
  });

  it('then it should generate a new secret using niceware', async () => {
    await getNewSecret(req, res);

    expect(niceware.generatePassphrase).toHaveBeenCalledTimes(1);
    expect(niceware.generatePassphrase).toHaveBeenCalledWith(8);
  });

  it('then it should return users roles', async () => {
    await getNewSecret(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      secret: 'password-password2',
    });
  });
});
