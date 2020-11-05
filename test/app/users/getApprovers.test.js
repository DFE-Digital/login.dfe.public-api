jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/directories');

const { mockResponse, mockRequest } = require('./../../utils');
const { listOrganisationUsersV3 } = require('./../../../src/infrastructure/organisations');
const { getPoliciesOfService } = require('./../../../src/infrastructure/access');
const { usersByIds } = require('./../../../src/infrastructure/directories');

const getApprovers = require('./../../../src/app/users/getApprovers');

const res = mockResponse();

describe('when getting approver organisations', () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: 'serviceId',
        relyingParty: {
          params: {
            canViewApproverReport: 'true'
          }
        }
      }
    });

    res.mockResetAll();

    listOrganisationUsersV3.mockReset().mockReturnValue({
      users: [
        {
          userId: 'userId',
          organisation: {
            id: 'orgId',
            name: 'organisation name',
            category: {
              id: '051',
              name: 'Further Education',
            },
            urn: null,
            uid: null,
            ukprn: '12345',
            status: {
              id: 1,
              name: 'Open',
            },
            address: null,
            legacyId: '1234',
            companyRegistrationNumber: null,
          },
          role: {
            id: 10000,
            name: 'Approver',
          },
          status: 1,
          numericIdentifier: '84',
          textIdentifier: '77fffdd',
        },
      ],
      page: 1,
      totalNumberOfPages: 2,
      totalNumberOfRecords: 20,
    });
    getPoliciesOfService.mockReset().mockReturnValue([]);
    usersByIds.mockReset().mockReturnValue([
      {
        sub: 'userId',
        given_name: 'User',
        family_name:'One',
        email: 'user.one@unit.tests'
      },
    ]);
  });

  it('then it should return bad request if page specified but not a number', async () => {
    req.query = {
      page: 'one',
    };

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('one is not a valid value for page. Expected a number');
  });

  it('then it should return bad request if pageSize specified but not a number', async () => {
    req.query = {
      pagesize: 'ten',
    };

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('ten is not a valid value for pageSize. Expected a number');
  });

  it('then it should return bad request if the request-message relying party is not provided', async () => {
    req.client.relyingParty = undefined;

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return bad request if the request-message relying party param is not provided', async () => {
    req.client.relyingParty.params = undefined;

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return bad request if the request-message relying party param is set to an empty string', async () => {
    req.client.relyingParty.params = "";

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return bad request if the request-message relying party param is named canTViewApproverReport', async () => {
    req.client.relyingParty.params = {};
    req.client.relyingParty.params.canTViewApproverReport = 'true';

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return bad request if the request-message relying party param canViewApproverReport is false', async () => {
    req.client.relyingParty.params.canViewApproverReport = 'false';

    await getApprovers(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should call access to get policies for serviceId', async () => {
    await getApprovers(req, res);

    expect(getPoliciesOfService).toHaveBeenCalledTimes(1);
    expect(getPoliciesOfService).toHaveBeenCalledWith(req.client.id, req.correlationId);
  });

  it('then it should call organisations to get page of org approvers with defaults', async () => {
    await getApprovers(req, res);

    expect(listOrganisationUsersV3).toHaveBeenCalledTimes(1);
    expect(listOrganisationUsersV3).toHaveBeenCalledWith(1, 25, 10000, [], req.correlationId);
  });

  it('then it should call organisations to get page of org approvers with policy conditions as filter', async () => {
    let mockPolicies = [{
      id: 'policy1',
      name: 'policy name',
      conditions: [{
        field: 'organisation.status.id',
        value: [
          '4',
          '3',
          '1'
        ]
      }]
    }];
    getPoliciesOfService.mockReset().mockReturnValue(mockPolicies);
    await getApprovers(req, res);

    expect(listOrganisationUsersV3).toHaveBeenCalledTimes(1);
    expect(listOrganisationUsersV3).toHaveBeenCalledWith(1, 25, 10000, mockPolicies, req.correlationId);
  });

  it('then it should call directories with the userIds', async () => {
    await getApprovers(req, res);

    expect(usersByIds).toHaveBeenCalledTimes(1);
    expect(usersByIds).toHaveBeenCalledWith('userId', req.correlationId);
  });

  it('then it should return mapped approvers', async () => {
    await getApprovers(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      users: [
        {
          userId: 'userId',
          roleId: 10000,
          roleName: 'Approver',
          email: 'user.one@unit.tests',
          familyName: 'One',
          givenName: 'User',
          organisation: {
            id: 'orgId',
            name: 'organisation name',
            category: {
              id: '051',
              name: 'Further Education',
            },
            urn: null,
            uid: null,
            ukprn: '12345',
            status: {
              id: 1,
              name: 'Open',
            },
            address: null,
            legacyId: '1234',
            companyRegistrationNumber: null,
          },
        },
      ]
    });
  });

  it('then it should return the page', async () => {
    await getApprovers(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      page: 1
    });
  });

  it('then it should return the total number of records', async () => {
    await getApprovers(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      numberOfRecords: 20
    });
  });

  it('then it should return the total number of pages', async () => {
    await getApprovers(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      numberOfPages: 2
    });
  });
});
