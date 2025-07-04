jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("login.dfe.api-client/services");

const { mockResponse, mockRequest } = require("./../../utils");
const updateService = require("./../../../src/app/services/updateService");
const {
  getServiceRaw,
  updateService: updateServiceDetails,
} = require("login.dfe.api-client/services");
const res = mockResponse();

describe("when updating child service", () => {
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
        name: "updated name",
        description: "updated description",
        redirectUris: ["https://updated.uri/auth/cb"],
      },
    });
    res.mockResetAll();

    getServiceRaw.mockReset().mockReturnValue({
      id: "service-1",
      name: "Service One",
      description: "First service",
      parentId: "parent-1",
      relyingParty: {
        client_id: "csvc1",
        client_secret: "some-super-secure-secret",
        redirect_uris: ["https://localhost:1234/auth/cb"],
      },
    });
    updateServiceDetails.mockReset();
  });

  it("then it should return an accepted result", async () => {
    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should update service with patched detalis", async () => {
    await updateService(req, res);

    expect(updateServiceDetails).toHaveBeenCalledTimes(1);
    expect(updateServiceDetails).toHaveBeenCalledWith({
      serviceId: "service-1",
      update: {
        name: "updated name",
        description: "updated description",
        redirectUris: ["https://updated.uri/auth/cb"],
      },
    });
  });

  it("then it should return not found if client does not exist", async () => {
    getServiceRaw.mockReturnValue(undefined);

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(updateServiceDetails).toHaveBeenCalledTimes(0);
  });

  it("then it should return not authorized if client not child of caller", async () => {
    req.client.id = "not-the-parent";

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(updateServiceDetails).toHaveBeenCalledTimes(0);
  });

  it("then it should return bad request if attempt to patch unpatchable property", async () => {
    req.body.clientSecret = "new-secret";

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      "clientSecret is not a patchable property. Patchable properties name,description,redirectUris,consentTitle,consentBody",
    );
    expect(updateServiceDetails).toHaveBeenCalledTimes(0);
  });

  it("then it should return bad request if dont attempt to patch any properties", async () => {
    req.body = {};

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      "Must specify at least one property. Patchable properties name,description,redirectUris,consentTitle,consentBody",
    );
    expect(updateServiceDetails).toHaveBeenCalledTimes(0);
  });

  it("then it should return bad request if attempt to patch redirectUris with value that is not an array", async () => {
    req.body.redirectUris = "not-an-array";

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith("redirectUris must be an array");
    expect(updateServiceDetails).toHaveBeenCalledTimes(0);
  });
});
