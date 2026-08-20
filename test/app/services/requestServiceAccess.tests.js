jest.mock("login.dfe.dao", () => ({
  services: {
    putUserServiceRequest: jest.fn(),
  },
}));

jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisation: jest.fn(),
}));

jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  getServiceDetailsByOrganisatonId: jest.fn(),
  getServiceRolesRaw: jest.fn(),
  getService: jest.fn(),
}));

jest.mock("login.dfe.jobs-client", () => ({
  NotificationClient: jest.fn().mockImplementation(() => ({
    sendServiceRequestToApprovers: jest.fn(),
  })),
}));

jest.mock("login.dfe.api-client/users", () => ({
  getUserServiceRequestsRaw: jest.fn(),
  getUserOrganisationsRaw: jest.fn(),
  getUser: jest.fn(),
}));

const requestServiceAccess = require("../../../src/app/services/requestServiceAccess");
const config = require("../../../src/infrastructure/config");

const { getUser } = require("login.dfe.api-client/users");
const { getOrganisation } = require("login.dfe.api-client/organisations");
const {
  getServiceDetailsByOrganisatonId,
  getServiceRolesRaw,
  getService,
} = require("login.dfe.api-client/services");

const { getUserServiceRequestsRaw } = require("login.dfe.api-client/users");
const { services } = require("login.dfe.dao");

describe("requestServiceAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getServiceDetailsByOrganisatonId.mockResolvedValue({});

    config.notifications.connectionString = "test-connection-string";
  });
  it("returns 400 when userId is missing from post request body", async () => {
    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "serviceId, organisation, userId and roleId are required.",
    });
  });

  it("returns 400 when roleId is missing from post request body", async () => {
    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        userId: "123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "serviceId, organisation, userId and roleId are required.",
    });
  });

  it("returns 400 when organisationId is missing from post request body", async () => {
    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        userId: "123",
        roleId: "1233",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "serviceId, organisation, userId and roleId are required.",
    });
  });

  it("returns 400 when user is not active", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 0,
    });

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "User has to be an active.",
    });
  });

  it("returns 404 when organisation does not exist", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
    });

    getOrganisation.mockResolvedValue(null);

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(getOrganisation).toHaveBeenCalledWith({
      by: {
        organisationId: "organisation-123",
      },
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Organisation not found",
    });
  });

  it("returns 404 when service does not exist", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
    });

    getOrganisation.mockResolvedValue({
      id: "organisation-123",
      name: "Test Organisation",
    });

    getService.mockResolvedValue(null);

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(getService).toHaveBeenCalledWith({
      by: {
        serviceId: "service-123",
      },
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Service not found",
    });
  });

  it("returns 400 when role is not valid for the service", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
    });

    getOrganisation.mockResolvedValue({
      id: "organisation-123",
      name: "Test Organisation",
    });

    getService.mockResolvedValue({
      id: "service-123",
      name: "Test Service",
    });

    getServiceRolesRaw.mockResolvedValue([
      {
        id: "different-role",
        name: "Different Role",
      },
    ]);

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(getServiceRolesRaw).toHaveBeenCalledWith({
      serviceId: "service-123",
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid role for service.",
    });
  });

  it("creates a service request and sends a notification for a valid request", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
    });

    getOrganisation.mockResolvedValue({
      id: "organisation-123",
      name: "Test Organisation",
    });

    getService.mockResolvedValue({
      id: "service-123",
      name: "Test Service",
    });

    getServiceRolesRaw.mockResolvedValue([
      {
        id: "role-123",
        name: "Test Role",
      },
    ]);

    getUserServiceRequestsRaw.mockResolvedValue([]);

    services.putUserServiceRequest.mockResolvedValue({});

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(services.putUserServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        service_id: "service-123",
        role_ids: "role-123",
        organisation_id: "organisation-123",
        status: 0,
        actioned_reason: "Pending",
        request_type: "service",
      }),
    );
  });

  it("returns 409 when an existing service request is already in progress", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
    });

    getOrganisation.mockResolvedValue({
      id: "organisation-123",
      name: "Test Organisation",
    });

    getService.mockResolvedValue({
      id: "service-123",
      name: "Test Service",
    });

    getServiceRolesRaw.mockResolvedValue([
      {
        id: "role-123",
        name: "Test Role",
      },
    ]);

    getUserServiceRequestsRaw.mockResolvedValue([
      {
        userId: "user-123",
        organisationId: "organisation-123",
        serviceId: "service-123",
      },
    ]);

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      "An existing request is already in progress",
    );
  });

  it("returns 400 when service does not belong to organisation", async () => {
    getUser.mockResolvedValue({
      id: "user-123",
      status: 1,
    });

    getServiceDetailsByOrganisatonId.mockResolvedValue(null);

    const req = {
      params: {
        sid: "service-123",
      },
      body: {
        organisation: "organisation-123",
        roleId: "role-123",
        userId: "user-123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await requestServiceAccess(req, res);

    expect(getServiceDetailsByOrganisatonId).toHaveBeenCalledWith({
      serviceId: "service-123",
      organisationId: "organisation-123",
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Service does not belong to organisation",
    });
  });
});
