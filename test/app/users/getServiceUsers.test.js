jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/organisations");

const {
  listServiceUsers,
} = require("./../../../src/infrastructure/organisations");
const { usersByIds } = require("./../../../src/infrastructure/directories");

const listUsers = require("./../../../src/app/users/getServiceUsers");

describe("listUsersWithFilters", () => {
  // listUsersWithFilters called when status, from OR to are provided as query parameters
  let mockReq;
  let mockRes;
  const DURATION = 7; // Consistent duration

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

    listServiceUsers.mockResolvedValue({
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
    });
    usersByIds.mockResolvedValue([
      {
        sub: "user1",
        email: "test@education.gov.uk",
        family_name: "Test",
        given_name: "User",
        status: "Active",
      },
    ]);
  });

  it('should return 400 if status is not "0"', async () => {
    mockReq.query = {
      status: 1,
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("status should only be 0");
  });

  it('should return 400 if "to" date is invalid', async () => {
    mockReq.query = {
      to: "invalid-date",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("to date is not a valid date");
  });

  it('should return 400 if "from" date is invalid', async () => {
    mockReq.query = {
      from: "invalid-date",
    };
    await listUsers(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("from date is not a valid date");
  });

  it("should return 400 if date range is in the future (both dates)", async () => {
    mockReq.query = {
      to: "2099-12-31",
      from: "2099-12-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "date range should not be in the future",
    );
  });

  it('should return 400 if "from" date is in the future (single date)', async () => {
    mockReq.query = {
      from: "2099-12-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "date range should not be in the future",
    );
  });

  it('should return 400 if "to" date is in the future (single date)', async () => {
    mockReq.query = {
      to: "2099-12-31",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith(
      "date range should not be in the future",
    );
  });

  it("should return 400 if fromDate is greater than toDate", async () => {
    mockReq.query = {
      from: "2023-01-10",
      to: "2023-01-01",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("from date greater than to date");
  });

  it("should return 400 if date range exceeds duration", async () => {
    mockReq.query = {
      from: "2023-01-01",
      to: "2023-01-09",
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
      from: "2023-01-01T00:00:00.000Z",
      to: "2023-01-05T00:00:00.000Z",
      page: 2,
      pageSize: 25,
      status: "0",
    };

    const serviceUsersData = {
      users: [{ id: "user123", data: "serviceData" }],
      totalNumberOfRecords: 1,
      page: 2,
      totalNumberOfPages: 1,
    };
    listServiceUsers.mockResolvedValue(serviceUsersData);

    const usersData = [
      { sub: "user123", email: "user@education.gov.uk", moreData: "userData" },
    ];
    usersByIds.mockResolvedValue(usersData);

    // TODO fix all these undefined
    const expectedResponseBody = {
      users: [
        {
          userId: "user123",
          email: "user@education.gov.uk",
          approvedAt: undefined,
          familyName: undefined,
          givenName: undefined,
          organisation: undefined,
          roleId: undefined,
          roleName: undefined,
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 2,
      numberOfPages: 1,
      dateRange:
        "Users between Sun Jan 01 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Thu Jan 05 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    };

    await listUsers(mockReq, mockRes);

    expect(listServiceUsers).toHaveBeenCalledWith(
      mockReq.client.id,
      "0",
      new Date("2023-01-01T00:00:00.000Z"),
      new Date("2023-01-05T00:00:00.000Z"),
      2,
      25,
      mockReq.correlationId,
    );
    expect(usersByIds).toHaveBeenCalledWith("user123", mockReq.correlationId);
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
    expect(listServiceUsers).toHaveBeenCalledWith(
      mockReq.client.id,
      undefined,
      new Date("2023-01-01T00:00:00.000Z"),
      new Date("2023-01-05T00:00:00.000Z"),
      1,
      25,
      mockReq.correlationId,
    );
    expect(mockRes.send).toHaveBeenCalled();
  });

  it("should successfully list users when no date parameters are provided", async () => {
    mockReq.query = {
      status: "0",
      page: 1,
      pageSize: 25,
    };

    // const expectedResponseBody = {
    //   users: [
    //     {
    //       userId: "user1",
    //       email: "test@education.gov.uk",
    //       approvedAt: "2023-01-01",
    //       familyName: "Test",
    //       givenName: "User",
    //       organisation: "OrgA",
    //       roleId: "role1",
    //       roleName: "Admin",
    //       updatedAt: "2023-01-02",
    //       userStatus: "Active",
    //     },
    //   ],
    //   numberOfRecords: 1,
    //   page: 1,
    //   numberOfPages: 1,
    //   dateRange:
    //     "Users between Sun Jan 01 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Thu Jan 05 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    // };

    await listUsers(mockReq, mockRes);

    //TODO need to figure out how to make date static
    // const futureDate = new Date();
    // futureDate.setDate(futureDate.getDate() + 7);

    // expect(listServiceUsers).toHaveBeenCalledWith(
    //   mockReq.client.id,
    //   "0",
    //   new Date(),
    //   futureDate,
    //   1,
    //   25,
    //   mockReq.correlationId,
    // );
    expect(mockRes.send).toHaveBeenCalled();
    // expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
  });

  it("should return empty users array if usersByIds returns null", async () => {
    mockReq.query = {
      from: "2023-01-01T00:00:00.000Z",
      to: "2023-01-05T00:00:00.000Z",
      status: "0",
      page: 1,
      pageSize: 25,
    };

    listServiceUsers.mockResolvedValue({
      users: [{ id: "user1" }], // Simulate a successful first call
      totalNumberOfRecords: 1,
      page: 1,
      totalNumberOfPages: 1,
    });
    usersByIds.mockResolvedValue(null); // Simulate no users found by Id (sub)

    const expectedBody = {
      users: [],
      numberOfRecords: 0,
      page: 0,
      numberOfPages: 0,
      dateRange:
        "Users between Sun Jan 01 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Thu Jan 05 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.send).toHaveBeenCalledWith(expectedBody);
  });

  it("should handle empty user list from listServiceUsers and subsequently empty from usersByIds", async () => {
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
    listServiceUsers.mockResolvedValue(pageOfServiceUsersEmpty);
    usersByIds.mockResolvedValue([]); // usersByIds called with "" and returns []

    const expectedResponseBody = {
      users: [],
      numberOfRecords: 0,
      page: 1,
      numberOfPages: 0,
      dateRange:
        "Users between Sun Jan 01 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Thu Jan 05 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    };

    await listUsers(mockReq, mockRes);

    expect(listServiceUsers).toHaveBeenCalled();
    expect(usersByIds).toHaveBeenCalledWith("", mockReq.correlationId);
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
    listServiceUsers.mockResolvedValue(serviceUsersData);
    const usersData = [{ sub: "s1", email: "e1" }];
    usersByIds.mockResolvedValue(usersData);
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
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 1,
      numberOfPages: 1,
      warning: "Only 7 days of data can be fetched",
      dateRange:
        "Users between Sun Mar 05 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Sun Mar 12 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).not.toHaveBeenCalledWith(400);

    expect(listServiceUsers).toHaveBeenCalled();
    expect(usersByIds).toHaveBeenCalled();
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
    listServiceUsers.mockResolvedValue(serviceUsersData);
    const usersData = [{ sub: "s2", email: "e2" }];
    usersByIds.mockResolvedValue(usersData);
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
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 1,
      numberOfPages: 1,
      warning: "Only 7 days of data can be fetched",
      dateRange:
        "Users between Mon Mar 13 2023 00:00:00 GMT+0000 (Greenwich Mean Time) and Mon Mar 20 2023 00:00:00 GMT+0000 (Greenwich Mean Time)",
    };

    await listUsers(mockReq, mockRes);

    expect(mockRes.status).not.toHaveBeenCalledWith(400);

    expect(listServiceUsers).toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalledWith(preparedResponse);
  });
});

describe("listUsersWithFilters", () => {
  // listUsersWithFilters called when status, from OR to are provided as query parameters
  let mockReq;
  let mockRes;
  //const DURATION = 7; // Consistent duration

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

    listServiceUsers.mockResolvedValue({
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
    });
    usersByIds.mockResolvedValue([
      {
        sub: "user1",
        email: "test@education.gov.uk",
        family_name: "Test",
        given_name: "User",
        status: "Active",
      },
    ]);
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

  it("should successfully list users with valid parameters (from and to dates provided)", async () => {
    mockReq.query = {
      page: 1,
      pageSize: 25,
    };

    const serviceUsersData = {
      users: [{ id: "user123", data: "serviceData" }],
      totalNumberOfRecords: 1,
      page: 2,
      totalNumberOfPages: 1,
    };
    listServiceUsers.mockResolvedValue(serviceUsersData);

    const usersData = [
      { sub: "user123", email: "user@education.gov.uk", moreData: "userData" },
    ];
    usersByIds.mockResolvedValue(usersData);

    // TODO fix all these undefined
    const expectedResponseBody = {
      users: [
        {
          userId: "user123",
          email: "user@education.gov.uk",
          approvedAt: undefined,
          familyName: undefined,
          givenName: undefined,
          organisation: undefined,
          roleId: undefined,
          roleName: undefined,
          updatedAt: undefined,
          userStatus: undefined,
        },
      ],
      numberOfRecords: 1,
      page: 2,
      numberOfPages: 1,
    };

    await listUsers(mockReq, mockRes);

    expect(listServiceUsers).toHaveBeenCalledWith(
      mockReq.client.id,
      null,
      1,
      25,
      mockReq.correlationId,
    );
    expect(usersByIds).toHaveBeenCalledWith("user123", mockReq.correlationId);
    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
    // Have to do a negative test because code implicitly will set the status to 200 on success
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
  });
});

// describe('prepareUserResponse (Actual implementation it - optional to be honest, as it should be unit tested separately)', () => {
//   // These would be its for the actual prepareUserResponse if it weren't mocked above.
//   // For the listUsersWithFilters its, mocking prepareUserResponse is usually sufficient.
//   const { prepareUserResponse } = require('./"./../../../src/app/users/getServiceUsers"');
//
//   it('should correctly map user service data and user data', () => {
//     const pageOfUserServices = {
//       users: [
//         { id: 'user1', createdAt: '2023-01-01', updatedAt: '2023-01-02', organisation: {name: 'Org It'}, role: { name: 'Tester', id: 'role1' } },
//         { id: 'user2', createdAt: '2023-02-01', updatedAt: '2023-02-02', organisation: {name: 'Org Dev'}, role: { name: 'Dev', id: 'role2' } },
//         { id: 'user3', createdAt: '2023-03-01', updatedAt: '2023-03-02', organisation: {name: 'Org Main'}, role: null } // No role
//       ],
//       totalNumberOfRecords: 3,
//       page: 1,
//       totalNumberOfPages: 1,
//     };
//     const users = [
//       { sub: 'user1', email: 'it@example.com', family_name: 'Testerson', given_name: 'It', status: 'Active' },
//       { sub: 'user2', email: 'dev@example.com', family_name: 'Developer', given_name: 'Dev', status: 'Inactive' },
//       // User3 has no match in usersByIds result
//     ];
//
//     const result = prepareUserResponse(pageOfUserServices, users);
//
//     expect(result.users).toHaveLength(3);
//     expect(result.users[0]).toEqual({
//       approvedAt: '2023-01-01',
//       updatedAt: '2023-01-02',
//       organisation: {name: 'Org It'},
//       roleName: 'Tester',
//       roleId: 'role1',
//       userId: 'user1',
//       email: 'it@example.com',
//       familyName: 'Testerson',
//       givenName: 'It',
//       userStatus: 'Active',
//     });
//     expect(result.users[1]).toEqual({
//       approvedAt: '2023-02-01',
//       updatedAt: '2023-02-02',
//       organisation: {name: 'Org Dev'},
//       roleName: 'Dev',
//       roleId: 'role2',
//       userId: 'user2',
//       email: 'dev@example.com',
//       familyName: 'Developer',
//       givenName: 'Dev',
//       userStatus: 'Inactive',
//     });
//       expect(result.users[2]).toEqual({
//       approvedAt: '2023-03-01',
//       updatedAt: '2023-03-02',
//       organisation: {name: 'Org Main'},
//       roleName: undefined,
//       roleId: undefined,
//       userId: 'user3',
//       // No email, name, status as user3 was not in the `users` array
//     });
//     expect(result.numberOfRecords).toBe(3);
//     expect(result.page).toBe(1);
//     expect(result.numberOfPages).toBe(1);
//   });

//   it('should handle empty pageOfUserServices.users', () => {
//     const pageOfUserServices = {
//       users: [],
//       totalNumberOfRecords: 0,
//       page: 1,
//       totalNumberOfPages: 0,
//     };
//     const users = [];
//     const result = prepareUserResponse(pageOfUserServices, users);
//     expect(result.users).toEqual([]);
//     expect(result.numberOfRecords).toBe(0);
//   });

//   it('should handle users not found in usersByIds lookup', () => {
//     const pageOfUserServices = {
//       users: [{ id: 'user1', createdAt: '2023-01-01', updatedAt: '2023-01-02', organisation: {name: 'Org It'}, role: { name: 'Tester', id: 'role1' } }],
//       totalNumberOfRecords: 1, page: 1, totalNumberOfPages: 1,
//     };
//     const users = []; // No matching user
//     const result = prepareUserResponse(pageOfUserServices, users);
//     expect(result.users[0]).toEqual(expect.objectContaining({
//       userId: 'user1',
//       email: undefined, // Because no match
//     }));
//   });
// })
