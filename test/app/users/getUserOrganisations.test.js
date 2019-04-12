jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').mockConfig());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').mockLogger());
jest.mock('./../../../src/infrastructure/organisations');

const { mockResponse, mockRequest } = require('./../../utils');
const { getOrganisationsAssociatedWithUser } = require('./../../../src/infrastructure/organisations');
const getUserOrganisations = require('./../../../src/app/users/getUsersOrganisations');

const res = mockResponse();

describe('when getting users organisations', async () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      params: {
        id: 'user-1',
      }
    });
    res.mockResetAll();

    getOrganisationsAssociatedWithUser.mockReset().mockReturnValue([
      {
        organisation: {
          "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
          "name": "Some org",
          "status": {
            "id": 1,
            "name": "Open"
          }
        },
        role: {
          "id": 0,
          "name": "End user"
        }
      }
      ]);
  });

  it('then it should call organisation api with userId', async () => {
    await getUserOrganisations(req, res);

    expect(getOrganisationsAssociatedWithUser).toHaveBeenCalledTimes(1);
    expect(getOrganisationsAssociatedWithUser).toHaveBeenCalledWith(req.params.id, req.correlationId);
  });

  it('then it should return mapped users organisations', async () => {
    await getUserOrganisations(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject([
      {
        "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        "name": "Some org",
        "status": {
          "id": 1,
          "name": "Open"
        },
      }
    ]);
  });
});
