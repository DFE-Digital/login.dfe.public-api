jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").mockLogger(),
);
jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/services", () => ({
  getServiceUsersForOrganisationRaw: jest.fn(),
  getServiceUsersWithRolesForOrganisationRaw: jest.fn(),
  getServiceRolesRaw: jest.fn(),
}));

const { mockResponse, mockRequest } = require("./../../utils");
const { getUsersRaw } = require("login.dfe.api-client/users");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const {
  getServiceUsersForOrganisationRaw,
  getServiceUsersWithRolesForOrganisationRaw,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");

const getUserOverview = require("./../../../src/app/organisations/getUserOverview");

const res = mockResponse();
const id = "10029085";
describe("when getting organisations users with roles by ukprn", () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: "serviceId",
      },
      params: {
        id,
      },
      query: {
        roles: "USER",
        page: 1,
        pageSize: 5,
      },
    });

    res.mockResetAll();

    getOrganisationRaw.mockReturnValue({
      id: "966B98F1-80F7-4BEB-B886-C9742F7A087F",
      name: "16-19 ABINGDON",
      category: {
        id: "051",
        name: "Further Education",
      },
      urn: null,
      uid: null,
      ukprn: "10029085",
      establishmentNumber: null,
      status: {
        id: 1,
        name: "Open",
      },
      closedOn: null,
      address: null,
      telephone: null,
      statutoryLowAge: null,
      statutoryHighAge: null,
      legacyId: "155",
      companyRegistrationNumber: null,
    });
    getServiceUsersForOrganisationRaw.mockReset().mockReturnValue([]);
    getServiceRolesRaw.mockReset().mockReturnValue([
      {
        id: "E53644D0-4B4A-43BD-92A9-F019EC63F978",
        name: "Dev User",
        code: "USER",
        numericId: "3",
        status: {
          id: 1,
        },
      },
    ]);
    getServiceUsersWithRolesForOrganisationRaw.mockReset().mockReturnValue({
      services: [
        {
          userId: "3AC5A26C-4DE4-45E9-914E-2D45AC98F298",
          serviceId: "057429C0-0700-4FCC-BDA5-32B5B7CE223F",
          organisationId: "966B98F1-80F7-4BEB-B886-C9742F7A087F",
          roles: {
            id: "E53644D0-4B4A-43BD-92A9-F019EC63F978",
            name: "Dev User",
            code: "USER",
            applicationId: "057429C0-0700-4FCC-BDA5-32B5B7CE223F",
            status: 1,
            numericId: "3",
            parentId: null,
            createdAt: "2018-12-04T08:08:26.266Z",
            updatedAt: "2018-12-04T08:08:26.266Z",
          },
          accessGrantedOn: "2020-01-15T14:01:05.138Z",
        },
        {
          userId: "E15CCDE2-FFDC-4593-8475-3759C0F86FFD",
          serviceId: "057429C0-0700-4FCC-BDA5-32B5B7CE223F",
          organisationId: "966B98F1-80F7-4BEB-B886-C9742F7A087F",
          roles: {
            id: "E53644D0-4B4A-43BD-92A9-F019EC63F978",
            name: "Dev User",
            code: "USER",
            applicationId: "057429C0-0700-4FCC-BDA5-32B5B7CE223F",
            status: 1,
            numericId: "3",
            parentId: null,
            createdAt: "2018-12-04T08:08:26.266Z",
            updatedAt: "2018-12-04T08:08:26.266Z",
          },
          accessGrantedOn: "2020-01-15T15:55:37.313Z",
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 2,
    });
    getUsersRaw.mockReset().mockReturnValue([
      {
        sub: "userId",
        given_name: "User",
        family_name: "One",
        email: "user.one@unit.tests",
      },
    ]);
  });

  it("then it should call org By type api with client params", async () => {
    await getUserOverview(req, res);
    expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { type: "UKPRN", identifierValue: id },
    });
  });

  it("then it should call roles api with client params", async () => {
    await getUserOverview(req, res);
    expect(getServiceRolesRaw).toHaveBeenCalledTimes(1);
    expect(getServiceRolesRaw).toHaveBeenCalledWith({
      serviceId: req.client.id,
    });
  });

  it("then it should call service users with roles api with client params", async () => {
    await getUserOverview(req, res);
    expect(getServiceUsersWithRolesForOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getServiceUsersWithRolesForOrganisationRaw).toHaveBeenCalledWith({
      serviceId: req.client.id,
      organisationId: "966B98F1-80F7-4BEB-B886-C9742F7A087F",
      serviceRoleIds: ["E53644D0-4B4A-43BD-92A9-F019EC63F978"],
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
  });

  it("then it should return users", async () => {
    await getUserOverview(req, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      page: 1,
      result: [
        {
          Title: [""],
          emails: ["user.one@unit.tests"],
          "name.familyname": ["One"],
          "name.givenname": ["User"],
        },
      ],
      totalPages: 1,
      totalRecords: 2,
    });
  });

  it("then it should return bad request if page specified but not a number", async () => {
    req.query = {
      roles: "one",
    };

    await getUserOverview(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should return bad request if the request-message client id is not provided", async () => {
    req.client.id = undefined;

    await getUserOverview(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should return bad request if the request-message relying party param is not provided", async () => {
    req.params.id = undefined;

    await getUserOverview(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
