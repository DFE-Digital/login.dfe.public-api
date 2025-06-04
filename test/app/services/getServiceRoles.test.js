const mockUtils = require("../../utils");

const res = mockUtils.mockResponse();
const mockLogger = mockUtils.mockLogger();

jest.mock("../../../src/infrastructure/config", () => mockUtils.mockConfig());
jest.mock("../../../src/infrastructure/logger", () => mockLogger);
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  getServiceRolesRaw: jest.fn(),
}));

const {
  getServiceRaw,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const getServiceRoles = require("../../../src/app/services/getServiceRoles");

describe("When getting the roles for a service", () => {
  let req;

  beforeEach(() => {
    req = mockUtils.mockRequest({
      client: {
        id: "parent-1",
        relyingParty: {
          client_id: "req-clientId",
        },
      },
      params: {
        clientid: "svc-clientId",
      },
    });

    res.mockResetAll();
    mockLogger.mockResetAll();

    getServiceRaw.mockReset().mockReturnValue({
      id: "service-1",
      parentId: "parent-1",
      relyingParty: {
        client_id: "svc-clientId",
      },
    });

    getServiceRolesRaw.mockReset().mockReturnValue([
      {
        id: "role-1",
        name: "Role One",
        code: "Role1",
        numericId: "123456",
        status: {
          id: 1,
        },
      },
      {
        id: "role-2",
        name: "Role Two",
        code: "Role2",
        numericId: "678910",
        status: {
          id: 0,
        },
      },
    ]);
  });

  it("then it should log the request", async () => {
    await getServiceRoles(req, res);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `req-clientId is attempting to get service roles for: svc-clientId (correlationId: ${req.correlationId}, clientCorrelationId: ${req.clientCorrelationId})`,
      {
        correlationId: req.correlationId,
        clientCorrelationId: req.clientCorrelationId,
        requester: "req-clientId",
        requestedClientId: "svc-clientId",
      },
    );
  });

  it("then it should return 404 if the requested service does not exist", async () => {
    getServiceRaw.mockReturnValue(undefined);

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should return 403 if the requester is neither the parent of, or the requested service itself", async () => {
    req.client.id = "not-a-match";
    req.client.relyingParty.client_id = "not-a-match";

    await getServiceRoles(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should return the roles if the requester is the parent of the requested service", async () => {
    req.client.relyingParty.client_id = "req-clientId";
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0].length).toEqual(
      getServiceRolesRaw().length,
    );
  });

  it("then it should return the roles if the requester is the requested service", async () => {
    req.client.relyingParty.client_id = "svc-clientId";
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0].length).toEqual(
      getServiceRolesRaw().length,
    );
  });

  it("then it should return an empty array if the requested service has no roles", async () => {
    getServiceRolesRaw.mockReturnValue(undefined);

    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("then it should return only the name, code, and status properties as strings", async () => {
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    res.json.mock.calls[0][0].forEach((role) => {
      // Check for only those properties.
      expect(Object.keys(role).sort()).toEqual(["code", "name", "status"]);
      // Check the property values are strings.
      expect(role).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          code: expect.any(String),
          status: expect.any(String),
        }),
      );
    });
  });

  it("then it should return the correct name and code values", async () => {
    const getRolesValues = [
      {
        name: "Role One",
        code: "Role1",
      },
      {
        name: "Role Two",
        code: "Role2",
      },
    ];
    getServiceRolesRaw.mockReturnValue(getRolesValues);

    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    res.json.mock.calls[0][0].forEach((role, index) => {
      expect(role).toEqual(
        expect.objectContaining({
          name: getRolesValues[index].name,
          code: getRolesValues[index].code,
        }),
      );
    });
  });

  it('then it should return the status as "Active" if the status ID is 1', async () => {
    getServiceRolesRaw.mockReset().mockReturnValue([
      {
        id: "role-1",
        name: "Role One",
        code: "Role1",
        numericId: "123456",
        status: {
          id: 1,
        },
      },
    ]);
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0][0].status).toEqual("Active");
  });

  it('then it should return the status as "Inactive" if the status ID is 0', async () => {
    getServiceRolesRaw.mockReturnValue([
      {
        id: "role-1",
        name: "Role One",
        code: "Role1",
        numericId: "123456",
        status: {
          id: 0,
        },
      },
    ]);
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0][0].status).toEqual("Inactive");
  });

  it('then it should return the status as "Inactive" if the status property does not exist', async () => {
    getServiceRolesRaw.mockReturnValue([
      {
        id: "role-1",
        name: "Role One",
        code: "Role1",
        numericId: "123456",
      },
    ]);
    await getServiceRoles(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0][0].status).toEqual("Inactive");
  });
});
