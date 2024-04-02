jest.mock('./../../../src/infrastructure/config', () => require('../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/applications');

const { mockResponse, mockRequest } = require('../../utils');
const { getClientByServiceId } = require('../../../src/infrastructure/applications');
const getService = require('../../../src/app/services/getService');

const res = mockResponse();

describe('when getting specific service', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: 'parent-1',
        relyingParty: {
          params: {
            canCreateChildApplications: 'true',
          },
        },
      },
    });
    res.mockResetAll();

    getAllRolesForService.mockReset().mockReturnValue({
      id: 'service-1',
      name: 'Service One',
      description: 'First service',
      parentId: 'parent-1',
      relyingParty: {
        client_id: 'csvc1',
        client_secret: 'some-super-secure-secret',
        redirect_uris: ['https://localhost:1234/auth/cb'],
      },
    });
  });

  it('then it should return service role list', async () => {
    await getServiceRoles(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      clientId: 'csvc1'
    });
  });

  it('then it should return not found if client does not exist', async () => {
    getClientByServiceId.mockReturnValue(undefined);

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return not authorized if client not child of caller', async () => {
    req.client.id = 'not-the-parent';

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
