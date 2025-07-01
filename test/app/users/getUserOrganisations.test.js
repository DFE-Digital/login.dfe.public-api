jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").mockLogger(),
);
jest.mock("login.dfe.api-client/users");

const { mockResponse, mockRequest } = require("./../../utils");
const { getUserOrganisationsRaw } = require("login.dfe.api-client/users");
const getUserOrganisations = require("./../../../src/app/users/getUsersOrganisations");

const res = mockResponse();

describe("when getting users organisations", () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      params: {
        id: "user-1",
      },
    });
    res.mockResetAll();

    getUserOrganisationsRaw.mockReset().mockReturnValue([
      {
        organisation: {
          id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
          name: "Some org",
          status: {
            id: 1,
            name: "Open",
          },
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
    ]);
  });

  it("should call organisation api with userId with mapped organisations", async () => {
    await getUserOrganisations(req, res);

    expect(getUserOrganisationsRaw).toHaveBeenCalledTimes(1);
    expect(getUserOrganisationsRaw).toHaveBeenCalledWith({
      userId: req.params.id,
    });
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject([
      {
        id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        name: "Some org",
        status: {
          id: 1,
          name: "Open",
        },
      },
    ]);
  });

  it("should return 404 if no organisations found", async () => {
    getUserOrganisationsRaw.mockReset().mockReturnValue([]);
    await getUserOrganisations(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status.mock.calls[0][0]).toBe(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("should remove hidden organisations from the returned list", async () => {
    getUserOrganisationsRaw.mockReset().mockReturnValue([
      {
        organisation: {
          id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
          name: "Some org",
          status: {
            id: 1,
            name: "Open",
          },
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
      {
        organisation: {
          id: "883c499b-6ce5-49e5-989d-36b0cd936e0b",
          name: "Placeholder org",
          status: {
            id: 0,
            name: "Hidden",
          },
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
    ]);
    await getUserOrganisations(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0].length).toBe(1);
    expect(res.send.mock.calls[0][0]).toMatchObject([
      {
        id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        name: "Some org",
        status: {
          id: 1,
          name: "Open",
        },
      },
    ]);
  });

  it("should raise an exception if an exception is raised on any api call", async () => {
    getUserOrganisationsRaw.mockReset().mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await getUserOrganisations(req, res);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
