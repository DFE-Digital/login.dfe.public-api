jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/applications');

const { mockRequest, mockResponse } = require('./../../utils');
const { getUsersAccessToServiceAtOrganisation } = require('./../../../src/infrastructure/access');
const getUsersAccess = require('./../../../src/app/services/getUsersAccess');
const { getClientByServiceId } = require('./../../../src/infrastructure/applications');

const uid = 'user-1';
const sid = 'service-1';
const oid = 'organisation-1';
const res = mockResponse();

describe('when getting users access to service', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      params: {
        uid,
        sid,
        oid,
      },
    });

    res.mockResetAll();

    getClientByServiceId.mockReset().mockReturnValue({
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

    getUsersAccessToServiceAtOrganisation.mockReset().mockReturnValue({
      userId: uid,
      serviceId: sid,
      organisationId: oid,
      roles: ['role1', 'role1'],
      identifiers: [{ key: 'some', value: 'thing' }],
      accessGrantedOn: '2018-08-17T15:44:16Z'
    });
  });

  it('then it should call access api with client params', async () => {
    await getUsersAccess(req, res);

    expect(getUsersAccessToServiceAtOrganisation).toHaveBeenCalledTimes(1);
    expect(getUsersAccessToServiceAtOrganisation).toHaveBeenCalledWith(uid, sid, oid, req.correlationId);
  });

  it('then it should return users roles', async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      roles: ['role1', 'role1'],
    });
  });

  it('then it should return users identifiers', async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      identifiers: [{ key: 'some', value: 'thing' }],
    });
  });

  it('then it should return user, service and org identifiers', async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      userId: uid,
      serviceId: sid,
      organisationId: oid,
    });
  });

  it('then it should return 404 if user has no access', async () => {
    getUsersAccessToServiceAtOrganisation.mockReturnValue(undefined);

    await getUsersAccess(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
