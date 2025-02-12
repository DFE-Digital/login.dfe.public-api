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
  getOrganisationStatuses,
} = require("../../../src/infrastructure/organisations/api");

const identifier = "identifier-1";
const correlationId = "abc123";
const apiResponse = [
  { id: 2, name: "Closed", tagColor: "red" },
  { id: 9, name: "Created in error", tagColor: "red" },
  { id: 5, name: "Dissolved", tagColor: "red" },
  { id: 0, name: "Hidden", tagColor: "grey" },
  { id: 6, name: "In Liquidation", tagColor: "red" },
  { id: 8, name: "Locked Duplicate", tagColor: "purple" },
  { id: 10, name: "Locked Restructure", tagColor: "purple" },
  { id: 1, name: "Open", tagColor: "green" },
  { id: 3, name: "Proposed to close", tagColor: "orange" },
  { id: 4, name: "Proposed to open", tagColor: "blue" },
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

  it("then it should call the states resource", async () => {
    await getOrganisationStatuses(correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations/states",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await getOrganisationStatuses(identifier, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should include the correlation id", async () => {
    await getOrganisationStatuses(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return null on a 401 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    });

    const result = await getOrganisationStatuses(correlationId);
    expect(result).toEqual(null);
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getOrganisationStatuses(correlationId);
    expect(result).toEqual(null);
  });

  it("should return false on a 409 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Conflict");
      error.statusCode = 409;
      throw error;
    });

    const result = await getOrganisationStatuses(correlationId);
    expect(result).toEqual(false);
  });

  it("should raise an exception on any failure status code that is not 401, 404 or 409", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () => getOrganisationStatuses(correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
