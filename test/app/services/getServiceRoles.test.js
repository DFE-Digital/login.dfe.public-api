const mockUtils = require('../../utils');

const res = mockUtils.mockResponse();
const mockLogger = mockUtils.mockLogger();

jest.mock('../../../src/infrastructure/config', () => mockUtils.mockConfig());
jest.mock('../../../src/infrastructure/logger', () => mockLogger);
jest.mock('../../../src/infrastructure/applications');
jest.mock('../../../src/infrastructure/access');

const { getClientByServiceId } = require('../../../src/infrastructure/applications');
const { getRoles } = require('../../../src/infrastructure/access');
const getServiceRoles = require('../../../src/app/services/getServiceRoles');

const getRolesResult = [{
  id: 'role-1',
  name: 'Role One',
  code: 'Role1',
  numericId: '123456',
  status: {
    id: 1,
  },
}, {
  id: 'role-2',
  name: 'Role Two',
  code: 'Role2',
  numericId: '678910',
  status: {
    id: 1,
  },
}];

describe('When getting the roles for a service', () => {
  let req;

  beforeEach(() => {
    req = mockUtils.mockRequest({
      client: {
        id: 'parent-1',
        relyingParty: {
          client_id: 'req-clientId',
        },
      },
      params: {
        clientid: 'svc-clientId',
      },
    });

    res.mockResetAll();
    mockLogger.mockResetAll();

    getClientByServiceId.mockReset().mockReturnValue({
      id: 'service-1',
      parentId: 'parent-1',
      relyingParty: {
        client_id: 'svc-clientId',
      },
    });

    getRoles.mockReset().mockReturnValue(getRolesResult);
  });

  it('then it should log the request', async () => {
    await getServiceRoles(req, res);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(`req-clientId is attempting to get service roles for: svc-clientId (correlationId: ${req.correlationId}, clientCorrelationId: ${req.clientCorrelationId})`, {
      correlationId: req.correlationId,
      clientCorrelationId: req.clientCorrelationId,
      requester: 'req-clientId',
      requestedClientId: 'svc-clientId',
    });
  });

  it('then it should return 404 if the requested service does not exist', async () => {
    getClientByServiceId.mockReturnValue(undefined);

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 403 if the requester is neither the parent of, or the requested service itself', async () => {
    req.client.id = 'not-a-match';
    req.client.relyingParty.client_id = 'not-a-match';

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return the roles if the requester is the parent of the requested service', async () => {
    req.client.relyingParty.client_id = 'req-clientId';
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(getRolesResult);
  });

  it('then it should return the roles if the requester is the requested service', async () => {
    req.client.relyingParty.client_id = 'svc-clientId';
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(getRolesResult);
  });

  it('then it should return an empty array if the requested service has no roles', async () => {
    getRoles.mockReturnValue(undefined);

    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
