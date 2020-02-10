jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/directories');

const { mockResponse, mockRequest } = require('./../../utils');
const { listOrganisationUsersV2 } = require('./../../../src/infrastructure/organisations');
const { getPoliciesOfService } = require('./../../../src/infrastructure/access');
const { usersByIds } = require('./../../../src/infrastructure/directories');

const getUserOverview = require('./../../../src/app/organisations/getUserOverview');

const res = mockResponse();

describe('when getting organisations users with roles and ukprn', () => {
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

        listOrganisationUsersV2.mockReset().mockReturnValue({
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

        await getUserOverview(req, res);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledTimes(1);
        expect(res.send).toHaveBeenCalledWith('one is not a valid value for page. Expected a number');
    });

    it('then it should return bad request if pageSize specified but not a number', async () => {
        req.query = {
            pagesize: 'ten',
        };

        await getUserOverview(req, res);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledTimes(1);
        expect(res.send).toHaveBeenCalledWith('ten is not a valid value for pageSize. Expected a number');
    });

    it('then it should return bad request if the request-message relying party is not provided', async () => {
        req.client.relyingParty = undefined;

        await getUserOverview(req, res);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledTimes(1);
    });

    it('then it should return bad request if the request-message relying party param is not provided', async () => {
        req.client.relyingParty.params = undefined;

        await getUserOverview(req, res);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledTimes(1);
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

});
