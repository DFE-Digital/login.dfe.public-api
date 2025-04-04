jest.mock("uuid");
jest.mock("niceware");
jest.mock("./../../../src/infrastructure/applications", () => ({
  createService: jest.fn(),
}));

const { mockResponse, mockRequest } = require("./../../utils");
const uuid = require("uuid");
const {
  createService: createServiceInApi,
} = require("./../../../src/infrastructure/applications");
const createService = require("./../../../src/app/services/createService");

const res = mockResponse();

describe("when creating a sub-application", () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: "parent-1",
        relyingParty: {
          params: {
            canCreateChildApplications: "true",
          },
        },
      },
      body: {
        name: "service one",
        description: "first child service",
        redirectUris: ["https://localhost:1234/auth/cb"],
      },
    });

    res.mockResetAll();

    uuid.v4.mockReset().mockReturnValue("new-uuid");

    createServiceInApi.mockReset().mockReturnValue({
      id: "service-1",
      name: "service one",
      description: "first child service",
      relyingParty: {
        client_id: "client-id-1",
        client_secret: "some-secret-string",
        redirect_uris: ["https://localhost:9876"],
      },
    });
  });

  it("then it should create service at api", async () => {
    await createService(req, res);

    expect(createServiceInApi).toHaveBeenCalledTimes(1);
    expect(createServiceInApi).toHaveBeenCalledWith({
      name: "service one",
      description: "first child service",
      isExternalService: false,
      isChildService: true,
      parentId: "parent-1",
      relyingParty: {
        client_id: "cnewuuid",
        client_secret: "new-uuid",
        redirect_uris: ["https://localhost:1234/auth/cb"],
        grant_types: ["authorization_code", "refresh_token"],
        params: {
          hideApprover: "true",
          hideSupport: "true",
          explicitConsent: "true",
        },
      },
    });
  });

  it("then it should return service details from api to caller in success response", async () => {
    await createService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      name: "service one",
      description: "first child service",
      clientId: "client-id-1",
      clientSecret: "some-secret-string",
      redirectUris: ["https://localhost:9876"],
    });
  });

  it("then it should return bad request if request is missing name", async () => {
    req.body.name = undefined;

    await createService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["Must provide name"],
    });
  });

  it("then it should return bad request if request is missing redirectUris", async () => {
    req.body.redirectUris = undefined;

    await createService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["Must provide at least 1 redirectUris"],
    });
  });

  it("then it should return bad request if request redirectUris has no items", async () => {
    req.body.redirectUris = [];

    await createService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["Must provide at least 1 redirectUris"],
    });
  });

  it("then it should return not authorized if client not configured to allow child applications", async () => {
    req.client.relyingParty.params.canCreateChildApplications = "false";

    await createService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
