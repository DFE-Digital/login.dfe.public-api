jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").mockLogger(),
);
jest.mock("login.dfe.api-client/organisations", () => ({
  addOrganisationAnnouncementRaw: jest.fn(),
  getPaginatedOrganisationsAnnouncementsRaw: jest.fn(),
}));

const { mockRequest, mockResponse } = require("./../../utils");
const {
  addOrganisationAnnouncementRaw,
  getPaginatedOrganisationsAnnouncementsRaw,
} = require("login.dfe.api-client/organisations");
const deleteAnnouncement = require("./../../../src/app/organisations/deleteAnnouncement");

const res = mockResponse();

describe("when deleting an organisation announcement", () => {
  let req;
  let announcement;

  beforeEach(() => {
    req = mockRequest({
      params: {
        messageId: "message-1",
      },
    });

    res.mockResetAll();

    announcement = {
      id: "announcement-1",
      originId: "message-1",
      organisationId: "org-1",
      type: 1,
      title: "Message 1",
      summary: "message one",
      body: "first message",
      publishedAt: "2019-01-31T14:49:00Z",
      expiresAt: "2020-01-31T14:49:00Z",
      published: true,
    };
    getPaginatedOrganisationsAnnouncementsRaw.mockReset().mockReturnValue({
      announcements: [announcement],
    });

    addOrganisationAnnouncementRaw.mockReset().mockReturnValue(announcement);
  });

  it("then it should return no content result", async () => {
    await deleteAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("then it should search for announcement by message id", async () => {
    await deleteAnnouncement(req, res);

    expect(getPaginatedOrganisationsAnnouncementsRaw).toHaveBeenCalledTimes(1);
    expect(getPaginatedOrganisationsAnnouncementsRaw).toHaveBeenCalledWith({
      announcementOriginId: "message-1",
    });
  });

  it("then it should upsert the announcement in orgs api to be unpublished", async () => {
    await deleteAnnouncement(req, res);

    expect(addOrganisationAnnouncementRaw).toHaveBeenCalledTimes(1);
    expect(addOrganisationAnnouncementRaw).toHaveBeenCalledWith({
      announcementBody: "first message",
      announcementOriginId: "message-1",
      announcementSummary: "message one",
      announcementTitle: "Message 1",
      announcementType: 1,
      expiresAt: "2020-01-31T14:49:00Z",
      isAnnouncementPublished: false,
      organisationId: "org-1",
      publishedAt: "2019-01-31T14:49:00Z",
    });
  });

  it("then it should return not found result if no message by id", async () => {
    getPaginatedOrganisationsAnnouncementsRaw.mockReturnValue({
      announcements: [],
    });

    await deleteAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
