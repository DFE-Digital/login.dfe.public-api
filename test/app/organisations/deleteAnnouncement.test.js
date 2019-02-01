jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/organisations');

const { mockRequest, mockResponse } = require('./../../utils');
const { searchForAnnouncements, upsertOrganisationAnnouncement } = require('./../../../src/infrastructure/organisations');
const deleteAnnouncement = require('./../../../src/app/organisations/deleteAnnouncement');

const res = mockResponse();

describe('when deleting an organisation announcement', () => {
  let req;
  let announcement;

  beforeEach(() => {
    req = mockRequest({
      params: {
        messageId: 'message-1',
      },
    });

    res.mockResetAll();

    announcement = {
      id: 'announcement-1',
      originId: 'message-1',
      organisationId: 'org-1',
      type: 1,
      title: 'Message 1',
      summary: 'message one',
      body: 'first message',
      publishedAt: '2019-01-31T14:49:00Z',
      expiresAt: '2020-01-31T14:49:00Z',
      published: true,
    };
    searchForAnnouncements.mockReset().mockReturnValue({
      announcements: [announcement],
    });

    upsertOrganisationAnnouncement.mockReset().mockReturnValue(announcement)
  });

  it('then it should return no content result', async () => {
    await deleteAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should search for announcement by message id', async () => {
    await deleteAnnouncement(req, res);

    expect(searchForAnnouncements).toHaveBeenCalledTimes(1);
    expect(searchForAnnouncements).toHaveBeenCalledWith('message-1', req.correlationId);
  });

  it('then it should upsert the announcement in orgs api to be unpublished', async () => {
    await deleteAnnouncement(req, res);

    expect(upsertOrganisationAnnouncement).toHaveBeenCalledTimes(1);
    expect(upsertOrganisationAnnouncement).toHaveBeenCalledWith(
      'org-1',
      'message-1',
      1,
      'Message 1',
      'message one',
      'first message',
      '2019-01-31T14:49:00Z',
      '2020-01-31T14:49:00Z',
      false,
      req.correlationId);
  });

  it('then it should return not found result if no message by id', async () => {
    searchForAnnouncements.mockReturnValue({
      announcements: [],
    });

    await deleteAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
