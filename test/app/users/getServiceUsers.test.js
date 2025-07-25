/* eslint-disable no-undef */
jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/services", () => ({
  getFilteredServiceUsersRaw: jest.fn(),
  getServiceUsersPostRaw: jest.fn(),
}));

const { getUsersRaw } = require("login.dfe.api-client/users");
const {
  getFilteredServiceUsersRaw,
  getServiceUsersPostRaw,
} = require("login.dfe.api-client/services");

const listUsers = require("./../../../src/app/users/getServiceUsers");

jest.useFakeTimers().setSystemTime(new Date("2024-01-01"));

// Example data in a global context because this file has 2 sets of tests in it
const exampleListServiceUsersData = {
  users: [
    {
      id: "user1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      organisation: "OrgA",
      role: { name: "Admin", id: "role1" },
    },
  ],
  totalNumberOfRecords: 1,
  page: 1,
  totalNumberOfPages: 1,
};

const exampleUsersByIdsData = [
  {
    sub: "user1",
    email: "test@education.gov.uk",
    family_name: "Test",
    given_name: "User",
    status: "Active",
  },
];

const exampleGetServiceUsersData = {
  services: [
    {
      userId: "user1",
      serviceId: "4CD4B183-0EB5-40DE-94E3-1C7484A0AD43",
      organisationId: "org1",
      roles: [
        {
          id: "FA3DDF63-6D48-41BB-8706-1048B24D4744",
          name: "Submit Learner Data - Standard Submissions",
          code: "DCFT",
          numericId: "21818",
          status: {
            id: 1,
          },
        },
        {
          id: "70168373-41CC-4DF7-9CBC-DA7C9B2B2AE3",
          name: "Submit Learner Data - FE Workforce Governor",
          code: "FEWG",
          numericId: "21819",
          status: {
            id: 1,
          },
        },
      ],
      identifiers: [
        {
          key: "groups",
          value: "FEWG,DCFT",
        },
      ],
      accessGrantedOn: "2023-06-01T12:03:10.866Z",
    },
    {
      userId: "user2",
      serviceId: "4CD4B183-0EB5-40DE-94E3-1C7484A0AD43",
      organisationId: "org2",
      roles: [
        {
          id: "FDEE86CD-05DA-47B8-80D1-BC56D92A991B",
          name: "Submit Learner Data - Advanced Support Resubmit File",
          code: "RSF",
          numericId: "21824",
          status: {
            id: 1,
          },
        },
      ],
      identifiers: [],
      accessGrantedOn: "2023-02-22T14:50:01.691Z",
    },
    {
      userId: "user3",
      serviceId: "4CD4B183-0EB5-40DE-94E3-1C7484A0AD43",
      organisationId: "org3",
      roles: [],
      identifiers: [],
      accessGrantedOn: "2023-02-22T14:50:01.360Z",
    },
  ],
  page: 1,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 3,
};

describe("listUsersWithFilters", () => {
  // listUsersWithFilters called when status, from OR to are provided as query parameters
  let mockReq;
  let mockRes;
  const DURATION = 90; // Consistent duration

  beforeEach(() => {
    mockReq = {
      client: { id: "client123" },
      correlationId: "corrId123",
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    getServiceUsersPostRaw.mockResolvedValue(exampleGetServiceUsersData);
    getFilteredServiceUsersRaw.mockResolvedValue(exampleListServiceUsersData);
    getUsersRaw.mockResolvedValue(exampleUsersByIdsData);
  });

  it('should return 400 if status is not "0"', async () => {
    mockReq.query = {
      status: "not-a-number",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "Status is not valid. Should be either 0 or 1.",
    );
  });

  it('should return 400 if "to" date is invalid', async () => {
    mockReq.query = {
      to: "invalid-date",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("To date is not a valid date.");
  });

  it('should return 400 if "from" date is invalid', async () => {
    mockReq.query = {
      from: "invalid-date",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("From date is not a valid date.");
  });

  it("should return 400 if date range is in the future (both dates)", async () => {
    mockReq.query = {
      to: "2099-12-31",
      from: "2099-12-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "Date range should not be in the future",
    );
  });

  it('should return 400 if "from" date is in the future (single date)', async () => {
    mockReq.query = {
      from: "2099-12-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "Date range should not be in the future",
    );
  });

  it('should return 400 if "to" date is in the future (single date)', async () => {
    mockReq.query = {
      to: "2099-12-31",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "Date range should not be in the future",
    );
  });

  it("should return 400 if fromDate is greater than toDate", async () => {
    mockReq.query = {
      from: "2023-01-10",
      to: "2023-01-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("From date greater than to date");
  });

  it("should return 400 if date range exceeds duration", async () => {
    mockReq.query = {
      from: "2023-01-01",
      to: "2023-04-02",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      `Only ${DURATION} days are allowed between dates`,
    );
  });

  it("should return 400 if any extractor throws an error", async () => {
    mockReq.query = {
      status: 1,
      page: "not-a-number",
    };

    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "not-a-number is not a valid value for page. Expected a number",
    );
  });

  it("should successfully list users with valid parameters (from and to dates provided)", async () => {
    mockReq.query = {
      from: "2023-01-01",
      to: "2023-01-05",
      page: 2,
      pageSize: 25,
      status: "0",
    };

    const serviceUsersData = {
      users: [
        {
          id: "user1",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          organisation: { id: "org1" },
          role: { name: "Tester", id: "role1" },
        },
        {
          id: "user2",
          createdAt: "2023-02-01",
          updatedAt: "2023-02-02",
          organisation: { id: "org2" },
          role: { name: "Dev", id: "role2" },
        },
        {
          id: "user3",
          createdAt: "2023-03-01",
          updatedAt: "2023-03-02",
          organisation: { id: "org3" },
          role: null,
        }, // No role
      ],
      totalNumberOfRecords: 3,
      page: 1,
      totalNumberOfPages: 1,
    };

    getFilteredServiceUsersRaw.mockResolvedValue(serviceUsersData);

    const usersData = [
      {
        sub: "user1",
        email: "it@example.com",
        family_name: "Testerson",
        given_name: "It",
        status: "Active",
      },
      {
        sub: "user2",
        email: "dev@example.com",
        family_name: "Developer",
        given_name: "Dev",
        status: "Inactive",
      },
      // User3 has no match in getUsersRaw result
    ];
    getUsersRaw.mockResolvedValue(usersData);

    const expectedResponseBody = {
      users: [
        {
          approvedAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-02T00:00:00.000Z",
          organisation: { id: "org1" },
          roles: [
            {
              id: "FA3DDF63-6D48-41BB-8706-1048B24D4744",
              name: "Submit Learner Data - Standard Submissions",
              code: "DCFT",
              numericId: "21818",
              status: 1,
            },
            {
              id: "70168373-41CC-4DF7-9CBC-DA7C9B2B2AE3",
              name: "Submit Learner Data - FE Workforce Governor",
              code: "FEWG",
              numericId: "21819",
              status: 1,
            },
          ],
          roleName: "Tester",
          roleId: "role1",
          userId: "user1",
          email: "it@example.com",
          familyName: "Testerson",
          givenName: "It",
          userStatus: "Active",
        },
        {
          approvedAt: "2023-02-01T00:00:00.000Z",
          updatedAt: "2023-02-02T00:00:00.000Z",
          organisation: { id: "org2" },
          roles: [
            {
              id: "FDEE86CD-05DA-47B8-80D1-BC56D92A991B",
              name: "Submit Learner Data - Advanced Support Resubmit File",
              code: "RSF",
              numericId: "21824",
              status: 1,
            },
          ],
          roleName: "Dev",
          roleId: "role2",
          userId: "user2",
          email: "dev@example.com",
          familyName: "Developer",
          givenName: "Dev",
          userStatus: "Inactive",
        },
        {
          approvedAt: "2023-03-01T00:00:00.000Z",
          updatedAt: "2023-03-02T00:00:00.000Z",
          organisation: { id: "org3" },
          roles: [],
          roleName: undefined,
          roleId: undefined,
          userId: "user3",
          // No email, name, status as user3 was not in the `users` array
        },
      ],
      numberOfRecords: 3,
      page: 1,
      numberOfPages: 1,
      dateRange:
        "Users between Sun, 01 Jan 2023 00:00:00 GMT and Thu, 05 Jan 2023 00:00:00 GMT",
    };

    await listUsers(mockReq, mockRes);

    expect(getFilteredServiceUsersRaw).toHaveBeenCalledWith({
      dateFrom: new Date("2023-01-01T00:00:00.000Z"),
      dateTo: new Date("2023-01-05T00:00:00.000Z"),
      pageNumber: 2,
      pageSize: 25,
      serviceId: "client123",
      userStatus: "0",
    });
    expect(getUsersRaw).toHaveBeenCalledWith({
      by: { userIds: ["user1", "user2", "user3"] },
    });
    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
    // Have to do a negative test because code implicitly will set the status to 200 on success
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
  });

  it("should successfully list users when status param is null (fetches all statuses)", async () => {
    mockReq.query = {
      from: "2023-01-01T00:00:00.000Z",
      to: "2023-01-05T00:00:00.000Z",
      page: 1,
      pageSize: 25,
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).not.toHaveBeenCalledWith(400);
    expect(getFilteredServiceUsersRaw).toHaveBeenCalledWith({
      dateFrom: new Date("2023-01-01T00:00:00.000Z"),
      dateTo: new Date("2023-01-05T00:00:00.000Z"),
      pageNumber: 1,
      pageSize: 25,
      serviceId: "client123",
      userStatus: undefined,
    });
    expect(mockRes.send).toHaveBeenCalled();
  });

  it("should successfully list users when no date parameters are provided", async () => {
    // Mock current date to a fixed UTC time
    const fixedNow = new Date(Date.UTC(2024, 0, 1, 0, 0, 0)); // Jan 1, 2024 UTC
    jest.useFakeTimers().setSystemTime(fixedNow);

    mockReq.query = {
      status: "1",
      page: 1,
      pageSize: 25,
    };

    const expectedResponseBody = {
      users: [
        {
          userId: "user1",
          email: "test@education.gov.uk",
          approvedAt: "2023-01-01T00:00:00.000Z",
          familyName: "Test",
          givenName: "User",
          organisation: "OrgA",
          roleId: "role1",
          roleName: "Admin",
          roles: [],
          updatedAt: "2023-01-02T00:00:00.000Z",
          userStatus: "Active",
        },
      ],
      numberOfRecords: 1,
      page: 1,
      numberOfPages: 1,
      dateRange:
        "Users between Tue, 03 Oct 2023 00:00:00 GMT and Mon, 01 Jan 2024 00:00:00 GMT",
      warning: "Only 90 days of data can be fetched",
    };

    await listUsers(mockReq, mockRes);

    const dateTo = new Date(Date.UTC(2024, 0, 1, 0, 0, 0)); // fixedNow
    const dateFrom = new Date(dateTo);
    dateFrom.setUTCDate(dateFrom.getUTCDate() - 90); // 90 days before in UTC

    expect(getFilteredServiceUsersRaw).toHaveBeenCalledWith({
      dateFrom,
      dateTo,
      pageNumber: 1,
      pageSize: 25,
      serviceId: mockReq.client.id,
      userStatus: "1",
    });

    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);

    jest.useRealTimers(); // Clean up
  });

  it("should return empty users array if getUsersRaw returns null", async () => {
    mockReq.query = {
      from: "2023-01-01T00:00:00.000Z",
      to: "2023-01-05T00:00:00.000Z",
      status: "0",
      page: 1,
      pageSize: 25,
    };

    getFilteredServiceUsersRaw.mockResolvedValue({
      users: [{ id: "user1" }], // Simulate a successful first call
      totalNumberOfRecords: 1,
      page: 1,
      totalNumberOfPages: 1,
    });
    getUsersRaw.mockResolvedValue(null); // Simulate no users found by Id (sub)

    const expectedBody = {
      users: [],
      numberOfRecords: 0,
      page: 0,
      numberOfPages: 0,
      dateRange:
        "Users between Sun, 01 Jan 2023 00:00:00 GMT and Thu, 05 Jan 2023 00:00:00 GMT",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.send).toHaveBeenCalledWith(expectedBody);
  });

  it("should handle empty user list from getFilteredServiceUsersRaw and subsequently empty from getUsersRaw", async () => {
    mockReq.query = {
      from: "2023-01-01T00:00:00.000Z",
      to: "2023-01-05T00:00:00.000Z",
    };

    const pageOfServiceUsersEmpty = {
      users: [],
      totalNumberOfRecords: 0,
      page: 1,
      totalNumberOfPages: 0,
    };
    getFilteredServiceUsersRaw.mockResolvedValue(pageOfServiceUsersEmpty);
    getUsersRaw.mockResolvedValue([]); // getUsersRaw called with "" and returns []

    const expectedResponseBody = {
      users: [],
      numberOfRecords: 0,
      page: 0,
      numberOfPages: 0,
      dateRange:
        "Users between Sun, 01 Jan 2023 00:00:00 GMT and Thu, 05 Jan 2023 00:00:00 GMT",
    };

    await listUsers(mockReq, mockRes);

    expect(getFilteredServiceUsersRaw).toHaveBeenCalled();
    expect(getUsersRaw).not.toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
  });

  it('should handle valid single "from" date correctly and pass isWarning if set by findDateRange', async () => {
    mockReq.query = {
      from: "2023-03-05T00:00:00.000Z",
    };

    // Setup for a successful response flow
    const serviceUsersData = {
      users: [{ id: "s1" }],
      totalNumberOfRecords: 1,
      page: 1,
      totalNumberOfPages: 1,
    };
    getFilteredServiceUsersRaw.mockResolvedValue(serviceUsersData);
    const usersData = [{ sub: "s1", email: "e1" }];
    getUsersRaw.mockResolvedValue(usersData);
    const preparedResponse = {
      users: [
        {
          userId: "s1",
          approvedAt: undefined,
          email: "e1",
          familyName: undefined,
          givenName: undefined,
          organisation: undefined,
          roleId: undefined,
          roleName: undefined,
          roles: [],
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 1,
      numberOfPages: 1,
      warning: "Only 90 days of data can be fetched",
      dateRange:
        "Users between Sun, 05 Mar 2023 00:00:00 GMT and Sat, 03 Jun 2023 00:00:00 GMT",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).not.toHaveBeenCalledWith(400);

    expect(getFilteredServiceUsersRaw).toHaveBeenCalled();
    expect(getUsersRaw).toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalledWith(preparedResponse);
  });

  it('should handle valid single "to" date correctly and pass isWarning if set by findDateRange', async () => {
    mockReq.query = {
      to: "2023-03-20T00:00:00.000Z",
    };

    const serviceUsersData = {
      users: [{ id: "s2" }],
      totalNumberOfRecords: 1,
      page: 1,
      totalNumberOfPages: 1,
    };
    getFilteredServiceUsersRaw.mockResolvedValue(serviceUsersData);
    const usersData = [{ sub: "s2", email: "e2" }];
    getUsersRaw.mockResolvedValue(usersData);
    const preparedResponse = {
      users: [
        {
          userId: "s2",
          approvedAt: undefined,
          email: "e2",
          familyName: undefined,
          givenName: undefined,
          organisation: undefined,
          roleId: undefined,
          roleName: undefined,
          roles: [],
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 1,
      numberOfPages: 1,
      warning: "Only 90 days of data can be fetched",
      dateRange:
        "Users between Tue, 20 Dec 2022 00:00:00 GMT and Mon, 20 Mar 2023 00:00:00 GMT",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).not.toHaveBeenCalledWith(400);

    expect(getFilteredServiceUsersRaw).toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalledWith(preparedResponse);
  });
});

describe("listUsersWithoutFilters", () => {
  // listUsersWithoutFilters called when status, from OR to are NOT provided as query parameters
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      client: { id: "client123" },
      correlationId: "corrId123",
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    getServiceUsersPostRaw.mockResolvedValue(exampleGetServiceUsersData);
    getFilteredServiceUsersRaw.mockResolvedValue(exampleListServiceUsersData);
    getUsersRaw.mockResolvedValue(exampleUsersByIdsData);
  });

  it("should return 400 if pageSize is not a number", async () => {
    mockReq.query = {
      pageSize: "not-a-number",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "not-a-number is not a valid value for pageSize. Expected a number",
    );
  });

  it("should successfully list users with valid parameters", async () => {
    mockReq.query = {
      page: 1,
      pageSize: 25,
    };

    const serviceUsersData = {
      users: [
        {
          id: "user1",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-02T00:00:00.000Z",
          organisation: { name: "Org It" },
          role: { name: "Tester", id: "role1" },
        },
        {
          id: "user2",
          createdAt: "2023-02-01T00:00:00.000Z",
          updatedAt: "2023-02-02T00:00:00.000Z",
          organisation: { name: "Org Dev" },
          role: { name: "Dev", id: "role2" },
        },
        {
          id: "user3",
          createdAt: "2023-03-01T00:00:00.000Z",
          updatedAt: "2023-03-02T00:00:00.000Z",
          organisation: { name: "Org Main" },
          role: null,
        }, // No role
      ],
      totalNumberOfRecords: 3,
      page: 1,
      totalNumberOfPages: 1,
    };

    getFilteredServiceUsersRaw.mockResolvedValue(serviceUsersData);

    const usersData = [
      {
        sub: "user1",
        email: "it@example.com",
        family_name: "Testerson",
        given_name: "It",
        status: "Active",
      },
      {
        sub: "user2",
        email: "dev@example.com",
        family_name: "Developer",
        given_name: "Dev",
        status: "Inactive",
      },
      // User3 has no match in getUsersRaw result
    ];
    getUsersRaw.mockResolvedValue(usersData);

    const expectedResponseBody = {
      users: [
        {
          approvedAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-02T00:00:00.000Z",
          organisation: { name: "Org It" },
          roleName: "Tester",
          roles: [],
          roleId: "role1",
          userId: "user1",
          email: "it@example.com",
          familyName: "Testerson",
          givenName: "It",
          userStatus: "Active",
        },
        {
          approvedAt: "2023-02-01T00:00:00.000Z",
          updatedAt: "2023-02-02T00:00:00.000Z",
          organisation: { name: "Org Dev" },
          roleName: "Dev",
          roles: [],
          roleId: "role2",
          userId: "user2",
          email: "dev@example.com",
          familyName: "Developer",
          givenName: "Dev",
          userStatus: "Inactive",
        },
        {
          approvedAt: "2023-03-01T00:00:00.000Z",
          updatedAt: "2023-03-02T00:00:00.000Z",
          organisation: { name: "Org Main" },
          roleId: undefined,
          roleName: undefined,
          roles: [],
          userId: "user3",
          // No email, name, status as user3 was not in the `users` array
        },
      ],
      numberOfRecords: 3,
      page: 1,
      numberOfPages: 1,
    };

    await listUsers(mockReq, mockRes);

    expect(getFilteredServiceUsersRaw).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 25,
      serviceId: mockReq.client.id,
    });
    expect(getUsersRaw).toHaveBeenCalledWith({
      by: { userIds: ["user1", "user2", "user3"] },
    });
    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
    // Have to do a negative test because code implicitly will set the status to 200 on success
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
  });
});
