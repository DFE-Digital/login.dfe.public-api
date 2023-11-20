jest.mock('uuid');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/applications');

const uuid = require('uuid');
const { requestCorrelation } = require('./../../../src/app/utils');

const res = {};
const next = jest.fn();

describe('When processing a request', () => {
  let req;
  let middleware;

  beforeEach(() => {
    uuid.v4.mockReset().mockReturnValue('some-uuid');

    req = {
      get: jest.fn().mockReturnValue('client-correlation-id'),
    };

    middleware = requestCorrelation();
  });

  it('then it should add correlation id to request', () => {
    middleware(req, res, next);

    expect(req.correlationId).toBe('some-uuid');
  });

  it('then it should add client correlation id to request if in header', () => {
    middleware(req, res, next);

    expect(req.clientCorrelationId).toBe('client-correlation-id');
  });

  it('then it should not add client correlation id to request if not in header', () => {
    req.get.mockReturnValue(undefined);

    middleware(req, res, next);

    expect(req.clientCorrelationId).toBeUndefined();
  });

  it('then it should call next', () => {
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
