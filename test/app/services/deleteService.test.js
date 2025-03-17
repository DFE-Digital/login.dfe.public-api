jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/applications");

const { mockResponse, mockRequest } = require("../../utils");
const {
  destroyService,
  getClientByServiceId,
} = require("../../../src/infrastructure/applications");
const deleteService = require("../../../src/app/services/deleteService");

const res = mockResponse();

describe("when getting specific child service", () => {
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
    });
    res.mockResetAll();

    // Returns 202 on success
    destroyService.mockReset();

    getClientByServiceId.mockReset().mockReturnValue({
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
  });

  it("should return 202 on successful deletion", async () => {
    await deleteService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("should return 404 not found if client does not exist", async () => {
    getClientByServiceId.mockReturnValue(undefined);

    await deleteService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("should return 403 not authorized if client not child of caller", async () => {
    req.client.id = "not-the-parent";

    await deleteService(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
