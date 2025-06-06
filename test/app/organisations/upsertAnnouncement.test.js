jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").mockLogger(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationRaw: jest.fn(),
}));
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { mockRequest, mockResponse } = require("./../../utils");
const {
  upsertOrganisationAnnouncement,
} = require("./../../../src/infrastructure/organisations");
const upsertAnnouncement = require("./../../../src/app/organisations/upsertAnnouncement");

const res = mockResponse();

describe("when upserting an organisation announcement", () => {
  let req;
  let announcement;

  beforeEach(() => {
    req = mockRequest({
      body: {
        messageId: "message-1",
        urn: "123456",
        type: 1,
        title: "Message 1",
        summary: "message one",
        body: "first message",
        publishedAt: "2019-01-31T14:49:00Z",
        expiresAt: "2020-01-31T14:49:00Z",
      },
    });

    res.mockResetAll();

    getOrganisationRaw.mockReturnValue({
      id: "org1",
    });

    announcement = {
      id: "announcement-1",
      originId: "message-1",
      urn: "123456",
      type: 1,
      title: "Message 1",
      summary: "message one",
      body: "first message",
      publishedAt: "2019-01-31T14:49:00Z",
      expiresAt: "2020-01-31T14:49:00Z",
    };
    upsertOrganisationAnnouncement.mockReset().mockReturnValue(announcement);
  });

  it("then it should return the announcement details", async () => {
    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(announcement);
  });

  it("then it should get organisation by urn if urn specified", async () => {
    req.body.urn = "123456";
    req.body.uid = undefined;

    await upsertAnnouncement(req, res);

    expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { type: "001", identifierValue: req.body.urn },
    });
  });

  it("then it should get organisation by uid if uid specified", async () => {
    req.body.urn = undefined;
    req.body.uid = "123456";

    await upsertAnnouncement(req, res);

    expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { type: "010", identifierValue: req.body.uid },
    });
  });

  it("then it should upsert the announcement in orgs api", async () => {
    await upsertAnnouncement(req, res);

    expect(upsertOrganisationAnnouncement).toHaveBeenCalledTimes(1);
    expect(upsertOrganisationAnnouncement).toHaveBeenCalledWith(
      "org1",
      "message-1",
      1,
      "Message 1",
      "message one",
      "first message",
      "2019-01-31T14:49:00Z",
      "2020-01-31T14:49:00Z",
      true,
      req.correlationId,
    );
  });

  it("then it should return bad request if message id missing", async () => {
    req.body.messageId = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["messageId must be specified"],
    });
  });

  it("then it should return bad request if type missing", async () => {
    req.body.type = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["type must be specified"],
    });
  });

  it("then it should return bad request if type is invalid", async () => {
    req.body.type = 3;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["type must be one of 1, 2, 4, 5. Received 3"],
    });
  });

  it("then it should return bad request if summary missing", async () => {
    req.body.summary = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["summary must be specified"],
    });
  });

  it("then it should return bad request if body missing", async () => {
    req.body.body = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["body must be specified"],
    });
  });

  it("then it should return bad request if publishedAt missing", async () => {
    req.body.publishedAt = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["publishedAt must be specified"],
    });
  });

  it("then it should return bad request if urn and uid missing", async () => {
    req.body.urn = undefined;
    req.body.uid = undefined;

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["urn or uid must be specified must be specified"],
    });
  });

  it("then it should return bad request if urn and uid missing", async () => {
    req.body.urn = "123456";
    req.body.uid = "123456";

    await upsertAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: ["Can only specify urn or uid, not both"],
    });
  });
});
