jest.mock('niceware');
jest.mock('./../../../src/infrastructure/applications', () => ({
  getClientByServiceId: jest.fn(),
  updateService: jest.fn(),
}));

jest.mock('uuid')


const { mockResponse, mockRequest } = require('./../../utils');
const uuid = require('uuid');
const { getClientByServiceId, updateService } = require('./../../../src/infrastructure/applications');
const regenerateSecret = require('./../../../src/app/services/regenerateSecret');

const res = mockResponse();

describe('when creating a sub-application', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: 'parent-1',
      },
      params: {
        clientid: 'client-id-1',
      },
    });

    res.mockResetAll();

    uuid.v4.mockReset().mockReturnValue('428fd7d3-b6d5-4cc0-8645-57cc22164fca');

    getClientByServiceId.mockReset().mockReturnValue({
      id: 'service-1',
      name: 'service one',
      description: 'first child service',
      parentId: 'parent-1',
      relyingParty: {
        client_id: 'client-id-1',
        client_secret: 'some-secret-string',
        redirect_uris: ['https://localhost:9876'],
      },
    });
    updateService.mockReset();
  });

  it('then it should get service using client id', async () => {
    await regenerateSecret(req, res);

    expect(getClientByServiceId).toHaveBeenCalledTimes(1);
    expect(getClientByServiceId).toHaveBeenCalledWith('client-id-1');
  });

  it('then it should patch service with new client secret', async () => {
    await regenerateSecret(req, res);

    expect(updateService).toHaveBeenCalledTimes(1);
    expect(updateService).toHaveBeenCalledWith('service-1', { clientSecret: '428fd7d3-b6d5-4cc0-8645-57cc22164fca' }, req.correlationId);
  });

  it('then it should return new client secret', async () => {
    await regenerateSecret(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ clientSecret: '428fd7d3-b6d5-4cc0-8645-57cc22164fca' });
  });

  it('then it should return not found if not client with specified client id', async () => {
    getClientByServiceId.mockReturnValue(undefined);

    await regenerateSecret(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return not authorized if not client not child of caller', async () => {
    req.client.id = 'different-parent';

    await regenerateSecret(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
