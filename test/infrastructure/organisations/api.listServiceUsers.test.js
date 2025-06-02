jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig({
    organisations: {
      type: "api",
      service: {
        url: "http://organisations.test",
        retryFactor: 0,
        numberOfRetries: 2,
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  listServiceUsers,
} = require("../../../src/infrastructure/organisations/api");

const serviceId = "service-1";
const userIds = ["user-1"];
const page = 1;
const pageSize = 10;
const correlationId = "abc123";
const apiResponse = [
  {
    userId: "user-1",
    serviceId: "service1Id",
    organisationId: "organisation-1",
    roles: [],
  },
  {
    userId: "user-1",
    serviceId: "service2Id",
    organisationId: "organisation-1",
    roles: [],
  },
];

describe("when getting a users services mapping from api", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("then it should call users resource with user id", async () => {
    await listServiceUsers(serviceId, userIds, page, pageSize, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/services/service-1/users",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "POST",
    });
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await listServiceUsers(serviceId, userIds, page, pageSize, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should include the correlation id", async () => {
    await listServiceUsers(
      serviceId,
      userIds,
      undefined,
      undefined,
      undefined,
      page,
      pageSize,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await listServiceUsers(
      serviceId,
      userIds,
      page,
      pageSize,
      correlationId,
    );
    expect(result).toEqual(undefined);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () =>
      listServiceUsers(serviceId, userIds, page, pageSize, correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
