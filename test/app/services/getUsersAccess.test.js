const { organisation } = require("login.dfe.dao");
const { getUserServiceRaw } = require("login.dfe.api-client/users");
const {
  mockRequest,
  mockResponse,
  mockConfig,
  mockLogger,
} = require("../../utils");
const getUsersAccess = require("../../../src/app/services/getUsersAccess");
const {
  getClientByServiceId,
} = require("../../../src/infrastructure/applications");

jest.mock("./../../../src/infrastructure/config", () => mockConfig());
jest.mock("./../../../src/infrastructure/logger", () => mockLogger());
jest.mock("login.dfe.dao", () => ({
  organisation: {
    getOrganisation: jest.fn(),
    getUserOrganisationIdentifiers: jest.fn(),
  },
}));
jest.mock("./../../../src/infrastructure/access");
jest.mock("./../../../src/infrastructure/applications");
jest.mock("login.dfe.api-client/users");

const uid = "b5d58c18-a13c-4ecc-a7cd-0003350447e1";
const sid = "e191b83e-233c-4142-9d4c-df0454fed8ab";
const oid = "446cb040-6f4d-4051-a3b8-004a997bb991";
const res = mockResponse();

describe("when getting users access to service", () => {
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
      id: "e191b83e-233c-4142-9d4c-df0454fed8ab",
      name: "Service One",
      description: "First service",
      parentId: "parent-1",
      relyingParty: {
        client_id: "csvc1",
        client_secret: "some-super-secure-secret",
        redirect_uris: ["https://localhost:1234/auth/cb"],
      },
    });

    getUserServiceRaw.mockReset().mockReturnValue({
      userId: uid,
      serviceId: sid,
      organisationId: oid,
      roles: ["role1", "role1"],
      identifiers: [{ key: "some", value: "thing" }],
      accessGrantedOn: "2018-08-17T15:44:16Z",
    });

    organisation.getUserOrganisationIdentifiers.mockReset().mockReturnValue({
      numericIdentifier: 123456,
      textIdentifier: "foobarbaz",
    });

    organisation.getOrganisation.mockReset().mockReturnValue({
      legacyId: "123456",
      IsOnAPAR: true,
    });
  });

  it("then it should call access api with client params", async () => {
    await getUsersAccess(req, res);

    expect(getUserServiceRaw).toHaveBeenCalledTimes(1);
    expect(getUserServiceRaw).toHaveBeenCalledWith({
      organisationId: "446cb040-6f4d-4051-a3b8-004a997bb991",
      serviceId: "e191b83e-233c-4142-9d4c-df0454fed8ab",
      userId: "b5d58c18-a13c-4ecc-a7cd-0003350447e1",
    });
  });

  it("then it should return users roles", async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      roles: ["role1", "role1"],
    });
  });

  it("then it should return users identifiers", async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      identifiers: [{ key: "some", value: "thing" }],
    });
  });

  it("then it should return user, service and org identifiers", async () => {
    await getUsersAccess(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      userId: uid,
      serviceId: sid,
      organisationId: oid,
    });
  });

  it("then it should return 404 if user has no access", async () => {
    getUserServiceRaw.mockReturnValue(undefined);

    await getUsersAccess(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
