jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig({
    access: {
      type: "api",
      service: {
        url: "http://access.test",
        retryFactor: 0,
        numberOfRetries: 2,
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const { getServiceUsersV2 } = require("../../../src/infrastructure/access/api");

const serviceId = "service-1";
const organisationId = "org-1";
const roleIds = ["role-1", "role-2"];
const page = 1;
const pageSize = 10;
const correlationId = "abc123";
const apiResponse = {};

describe("when calling the getServiceUsersV2 function", () => {
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

  it("then it should call service resource with the provided parameters", async () => {
    await getServiceUsersV2(
      serviceId,
      organisationId,
      roleIds,
      page,
      pageSize,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://access.test/services/service-1/organisations/org-1/users?version=v2&page=1&pageSize=10&roleIds=role-1,role-2",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await getServiceUsersV2(
      serviceId,
      organisationId,
      roleIds,
      page,
      pageSize,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should include the correlation id", async () => {
    await getServiceUsersV2(
      serviceId,
      organisationId,
      roleIds,
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

  it("should return false on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getServiceUsersV2(
      serviceId,
      organisationId,
      roleIds,
      page,
      pageSize,
      correlationId,
    );
    expect(result).toEqual(undefined);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await getServiceUsersV2(
        serviceId,
        organisationId,
        roleIds,
        page,
        pageSize,
        correlationId,
      );
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
