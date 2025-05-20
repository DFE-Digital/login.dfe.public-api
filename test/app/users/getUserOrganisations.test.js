jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").mockLogger(),
);
jest.mock("./../../../src/infrastructure/organisations");
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

  it("then it should call organisation api with userId", async () => {
    await getUserOrganisations(req, res);

    expect(getUserOrganisationsRaw).toHaveBeenCalledTimes(1);
    expect(getUserOrganisationsRaw).toHaveBeenCalledWith({
      userId: req.params.id,
    });
  });

  it("then it should return mapped users organisations", async () => {
    await getUserOrganisations(req, res);

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
});
