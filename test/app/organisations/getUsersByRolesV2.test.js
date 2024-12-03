jest.mock('./../../../src/infrastructure/config', () => require('../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/directories');

const { mockResponse, mockRequest } = require('../../utils');
const { getOrganisationByTypeAndIdentifier, getUsersForOrganisation } = require('../../../src/infrastructure/organisations');
const { getServiceUsers } = require('../../../src/infrastructure/access');
const { usersByIds } = require('../../../src/infrastructure/directories');

const getUsersByRolesV2 = require('../../../src/app/organisations/getUsersByRolesV2');

const res = mockResponse();
const id = '10029085';
describe('when getting organisations users with roles by ukprn', () => {
  let req;

  const requestPayload = {
    client: {
      id: 'serviceId',
    },
    params: {
      id,
    },
    query: {
      roles: 'USER',
      page: 1,
      pageSize: 5,
    },
  };

  beforeEach(() => {
    req = mockRequest(requestPayload);

    res.mockResetAll();

    getOrganisationByTypeAndIdentifier.mockReset().mockReturnValue([{
      id: '966B98F1-80F7-4BEB-B886-C9742F7A087F',
      name: '16-19 ABINGDON',
      category: {
        id: '051',
        name: 'Further Education',
      },
      urn: null,
      uid: null,
      ukprn: '10029085',
      establishmentNumber: null,
      status: {
        id: 1,
        name: 'Open',
      },
      closedOn: null,
      address: null,
      telephone: null,
      statutoryLowAge: null,
      statutoryHighAge: null,
      legacyId: '155',
      companyRegistrationNumber: null,
    }]);

    getServiceUsers.mockReset().mockReturnValue({
      services: [
        {
          userId: '3AC5A26C-4DE4-45E9-914E-2D45AC98F298',
          serviceId: '057429C0-0700-4FCC-BDA5-32B5B7CE223F',
          organisationId: '966B98F1-80F7-4BEB-B886-C9742F7A087F',
          roles: [{
            id: 'E53644D0-4B4A-43BD-92A9-F019EC63F978',
            name: 'Dev User',
            code: 'USER',
            applicationId: '057429C0-0700-4FCC-BDA5-32B5B7CE223F',
            status: 1,
            numericId: 3,
            parentId: null,
            createdAt: '2018-12-04T08:08:26.266Z',
            updatedAt: '2018-12-04T08:08:26.266Z',
          }],
          accessGrantedOn: '2020-01-15T14:01:05.138Z',
        },
        {
          userId: 'E15CCDE2-FFDC-4593-8475-3759C0F86FFD',
          serviceId: '057429C0-0700-4FCC-BDA5-32B5B7CE223F',
          organisationId: '966B98F1-80F7-4BEB-B886-C9742F7A087F',
          roles: [{
            id: 'E53644D0-4B4A-43BD-92A9-F019EC63F978',
            name: 'Dev User',
            code: 'USER',
            applicationId: '057429C0-0700-4FCC-BDA5-32B5B7CE223F',
            status: 1,
            numericId: 3,
            parentId: null,
            createdAt: '2018-12-04T08:08:26.266Z',
            updatedAt: '2018-12-04T08:08:26.266Z',
          }],
          accessGrantedOn: '2020-01-15T15:55:37.313Z',
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 2,
    });

    usersByIds.mockReset().mockReturnValue([
      {
        sub: '3AC5A26C-4DE4-45E9-914E-2D45AC98F298',
        given_name: 'User',
        family_name: 'One',
        email: 'user.one@unit.tests',
      },
    ]);

    getUsersForOrganisation.mockReset().mockReturnValue([
      {
        id: '3AC5A26C-4DE4-45E9-914E-2D45AC98F298',
        status: 0,
        role: { id: 10000, name: 'Approver' },
        numericIdentifier: '68716',
        textIdentifier: 'k83rknd',
        totalNumberOfPages: 1,
      },
      {
        id: 'E15CCDE2-FFDC-4593-8475-3759C0F86FFD',
        status: 0,
        role: { id: 0, name: 'End user' },
        numericIdentifier: '71643',
        textIdentifier: '3rk7zde',
        totalNumberOfPages: 1,
      },
    ]);
  });

  it('should return 400 when not provided with an id in the params', async () => {
    req = mockRequest({
      client: {
        id: 'serviceId',
      },
      params: {},
      query: {
        roles: 'USER',
        page: 1,
        pageSize: 5,
      },
    });
    await getUsersByRolesV2(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when not provided with an client id', async () => {
    req = mockRequest({
      client: {},
      params: {
        id,
      },
      query: {
        roles: 'USER',
        page: 1,
        pageSize: 5,
      },
    });
    await getUsersByRolesV2(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('should return 404 no organisations are returned', async () => {
    getOrganisationByTypeAndIdentifier.mockReset().mockReturnValue([]);
    await getUsersByRolesV2(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when no users are returned from getServiceUsers', async () => {
    getServiceUsers.mockReset().mockReturnValue([]);
    await getUsersByRolesV2(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('should return some results when everything is set up', async () => {
    await getUsersByRolesV2(req, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      ukprn: '10029085',
      users: [
        {
          email: 'user.one@unit.tests',
          firstName: 'User',
          lastName: 'One',
          userStatus: undefined,
          roles: ['USER'],
        },
      ],
    });
  });

  it('should return some results when everything is set up and no query keys are provided', async () => {
    const clonedRequest = JSON.parse(JSON.stringify(requestPayload));
    delete clonedRequest.query.roles;

    await getUsersByRolesV2(clonedRequest, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      ukprn: '10029085',
      users: [
        {
          email: 'user.one@unit.tests',
          firstName: 'User',
          lastName: 'One',
          userStatus: undefined,
          roles: ['USER'],
        },
      ],
    });
  });

  it('should return some results when everything is set up and email is provided in the query', async () => {
    const clonedRequest = JSON.parse(JSON.stringify(requestPayload));
    clonedRequest.query.email = 'user.one@unit.tests';

    await getUsersByRolesV2(clonedRequest, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      ukprn: '10029085',
      users: [
        {
          email: 'user.one@unit.tests',
          firstName: 'User',
          lastName: 'One',
          userStatus: undefined,
          roles: ['USER'],
        },
      ],
    });
  });

  it('should return some results when everything is set up and userId is provided in the query', async () => {
    const clonedRequest = JSON.parse(JSON.stringify(requestPayload));
    clonedRequest.query.userId = '3AC5A26C-4DE4-45E9-914E-2D45AC98F298';

    await getUsersByRolesV2(clonedRequest, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      ukprn: '10029085',
      users: [
        {
          email: 'user.one@unit.tests',
          firstName: 'User',
          lastName: 'One',
          userStatus: undefined,
          roles: ['USER'],
        },
      ],
    });
  });
});
