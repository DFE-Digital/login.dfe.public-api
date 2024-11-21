jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').mockConfig({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
      retryFactor: 0,
      numberOfRetries: 2,
    },
  },
}));

const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');
const { upsertOrganisationAnnouncement } = require('../../../src/infrastructure/organisations/api');

const organisationId = 'org-1';
const messageId = 'message-1';
const type = 'type-1';
const title = 'title-1';
const summary = 'summary-1';
const body = 'body-1';
const publishedAt = '';
const expiresAt = '';
const published = true;
const correlationId = 'abc123';
const apiResponse = [
  {
    userId: 'user-1',
    serviceId: 'service1Id',
    organisationId: 'organisation-1',
    roles: [],
  },
  {
    userId: 'user-1',
    serviceId: 'service2Id',
    organisationId: 'organisation-1',
    roles: [],
  },
];

describe('when getting a users services mapping from api', () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('then it should call users resource with user id', async () => {
    await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://organisations.test/organisations/org-1/announcements');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'POST',
    });
  });

  it('should use the token from jwt strategy as bearer token', async () => {
    await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('should include the correlation id', async () => {
    await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('should return null on a 401 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    });

    const result = await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);
    expect(result).toEqual(null);
  });

  it('should return null on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);
    expect(result).toEqual(null);
  });

  it('should return false on a 409 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Conflict');
      error.statusCode = 409;
      throw error;
    });

    const result = await upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);
    expect(result).toEqual(false);
  });

  it('should raise an exception on any failure status code that is not 401, 404 or 409', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    const act = () => upsertOrganisationAnnouncement(organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId);

    await expect(act).rejects.toThrow(expect.objectContaining({
      message: 'Server Error',
      statusCode: 500,
    }));
  });
});
