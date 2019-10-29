jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/applications');

const { mockResponse, mockRequest } = require('./../../utils');
const { listServices: listChildServices } = require('./../../../src/infrastructure/applications');
const listServices = require('./../../../src/app/services/listServices');

const res = mockResponse();

describe('when listing child services', () => {
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

    listChildServices.mockReset().mockReturnValue({
      services: [
        {
          id: 'service-1',
          name: 'Service One',
          description: 'First service',
          relyingParty: {
            client_id: 'csvc1',
            client_secret: 'some-super-secure-secret',
            redirect_uris: ['https://localhost:1234/auth/cb'],
          },
        }
      ],
      numberOfRecords: 23,
      page: 1,
      numberOfPages: 2,
    });
  });

  it('then it should return page of services', async () => {
    await listServices(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      services: [
        {
          name: 'Service One',
          description: 'First service',
          clientId: 'csvc1',
          redirectUris: ['https://localhost:1234/auth/cb'],
        },
      ],
      numberOfRecords: 23,
      page: 1,
      numberOfPages: 2,
    });
  });

  it('then it should use client id of caller as parent when getting child services', async () => {
    await listServices(req, res);

    expect(listChildServices).toHaveBeenCalledTimes(1);
    expect(listChildServices.mock.calls[0][0]).toBe('parent-1');
  });

  it('then it should use default paging values if none specified', async () => {
    await listServices(req, res);

    expect(listChildServices).toHaveBeenCalledTimes(1);
    expect(listChildServices.mock.calls[0][1]).toBe(1);
    expect(listChildServices.mock.calls[0][2]).toBe(25);
  });

  it('then it should use specified page when available', async () => {
    req.query.page = 2;

    await listServices(req, res);

    expect(listChildServices).toHaveBeenCalledTimes(1);
    expect(listChildServices.mock.calls[0][1]).toBe(2);
  });

  it('then it should use specified page size when available', async () => {
    req.query.pageSize = 100;

    await listServices(req, res);

    expect(listChildServices).toHaveBeenCalledTimes(1);
    expect(listChildServices.mock.calls[0][2]).toBe(100);
  });
});
