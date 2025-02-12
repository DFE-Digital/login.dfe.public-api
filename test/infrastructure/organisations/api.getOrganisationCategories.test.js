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
  getOrganisationCategories,
} = require("../../../src/infrastructure/organisations/api");

const correlationId = "abc123";
const apiResponse = [
  { id: "052", name: "Billing Authority" },
  { id: "001", name: "Establishment" },
  { id: "011", name: "Government" },
  { id: "002", name: "Local Authority" },
  { id: "010", name: "Multi-Academy Trust" },
  { id: "012", name: "Other GIAS Stakeholder" },
  { id: "003", name: "Other Legacy Organisations" },
  { id: "008", name: "Other Stakeholders" },
  { id: "051", name: "PIMS Training Providers" },
  { id: "014", name: "Secure Single-Academy Trust" },
  { id: "013", name: "Single-Academy Trust" },
  { id: "050", name: "Software Suppliers" },
  { id: "009", name: "Training Providers" },
  { id: "053", name: "Youth Custody Service" },
];

describe("when using the getOrganisationCategories function", () => {
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

  it("then it should call categories resource", async () => {
    await getOrganisationCategories(correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://organisations.test/organisations/categories",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await getOrganisationCategories(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should include the correlation id", async () => {
    await getOrganisationCategories(correlationId);

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

    const result = await getOrganisationCategories(correlationId);
    expect(result).toEqual(null);
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getOrganisationCategories(correlationId);
    expect(result).toEqual(null);
  });

  it("should return false on a 409 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Conflict");
      error.statusCode = 409;
      throw error;
    });

    const result = await getOrganisationCategories(correlationId);
    expect(result).toEqual(false);
  });

  it("should raise an exception on any failure status code that is not 401, 404 or 409", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () => getOrganisationCategories(correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
