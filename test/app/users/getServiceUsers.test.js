jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/organisations");

const {
  listServiceUsers,
} = require("./../../../src/infrastructure/organisations");
const { usersByIds } = require("./../../../src/infrastructure/directories");

const listUsers = require("./../../../src/app/users/getServiceUsers");

// // Mocked helper functions
// const {
//   extractPageParam,
//   extractPageSizeParam,
//   extractStatusParam,
//   extractToParam,
//   extractFromParam,
//   isFutureDate,
//   findDateRange,
//   listServiceUsers,
//   usersByIds,
//   prepareUserResponse: mockPrepareUserResponse, // This is already a mock
//   addAddionalMessage,
//   resetAllMocks,
// } = require("./../../__mocks__/helperFunctions");

describe("listUsersWithFilters", () => {
  // listUsersWithFilters called when status, from OR to are provided as query parameters
  let mockReq;
  let mockRes;
  const DURATION = 7; // Consistent duration

  beforeEach(() => {
    // resetAllMocks(); // Reset all mocks from helperFunctions.js

    mockReq = {
      client: { id: "client123" },
      correlationId: "corrId123",
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // // Default mock implementations for helpers
    // extractPageParam.mockReturnValue(1);
    // extractPageSizeParam.mockReturnValue(10);
    // extractStatusParam.mockReturnValue("0"); // Default valid status
    // extractToParam.mockReturnValue(null);
    // extractFromParam.mockReturnValue(null);
    // isFutureDate.mockReturnValue(false); // Default to not future
    // findDateRange.mockImplementation(
    //   (toDate, fromDate, duration, isWarning) => ({
    //     toDate,
    //     fromDate,
    //     isWarning,
    //   }),
    // );
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
    // mockPrepareUserResponse.mockImplementation(
    //   (pageOfUserServicesData, usersData) => ({
    //     users: usersData.map((u) => ({ userId: u.sub, email: u.email })),
    //     numberOfRecords: pageOfUserServicesData.totalNumberOfRecords,
    //     page: pageOfUserServicesData.page,
    //     numberOfPages: pageOfUserServicesData.totalNumberOfPages,
    //   }),
    // );
    // addAddionalMessage.mockImplementation((body) => body);
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
    // expect(mockPrepareUserResponse).toHaveBeenCalledWith(
    //   serviceUsersData,
    //   usersData,
    // );
    // expect(addAddionalMessage).toHaveBeenCalledWith(
    //   expectedResponseBody,
    //   fromDateObj,
    //   toDateObj,
    //   DURATION,
    //   false,
    // );
    expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
  });

  // it("should successfully list users when status param is null (fetches all statuses)", async () => {
  //   mockReq.query = {
  //     from: "2023-01-01T00:00:00.000Z",
  //     to: "2023-01-05T00:00:00.000Z",
  //     page: 2,
  //     pageSize: 25,
  //   }
  //   //extractStatusParam.mockReturnValue(null); // Simulate status not being provided or "all"

  //   await listUsers(mockReq, mockRes);

  //   expect(mockRes.status).not.toHaveBeenCalledWith(400);
  //   expect(listServiceUsers).toHaveBeenCalledWith(
  //     mockReq.client.id,
  //     null, // Expect status to be passed as null
  //     fromDateObj,
  //     toDateObj,
  //     1, // default page from beforeEach
  //     10, // default pageSize from beforeEach
  //     mockReq.correlationId,
  //   );
  //   expect(mockRes.send).toHaveBeenCalled();
  // });

  // it("should successfully list users when no date parameters are provided", async () => {
  //   extractFromParam.mockReturnValue(null);
  //   extractToParam.mockReturnValue(null);
  //   // isFutureDate will not be called by the validation block as fromDate & toDate are undefined

  //   // Default findDateRange mock from beforeEach will return toDate: undefined, fromDate: undefined
  //   // Let's rely on that default, or be explicit if findDateRange has complex default logic
  //   findDateRange.mockReturnValue({
  //     fromDate: undefined,
  //     toDate: undefined,
  //     isWarning: false, // Or true if findDateRange defaults to setting a warning for no dates
  //   });

  //   await listUsersWithFilters(mockReq, mockRes);

  //   expect(mockRes.status).not.toHaveBeenCalledWith(400);
  //   // isFutureDate is not called within the date validation block if fromDate and toDate are undefined
  //   expect(isFutureDate).not.toHaveBeenCalled();

  //   expect(findDateRange).toHaveBeenCalledWith(
  //     undefined,
  //     undefined,
  //     DURATION,
  //     false,
  //   );
  //   expect(listServiceUsers).toHaveBeenCalledWith(
  //     mockReq.client.id,
  //     "0", // Default status from beforeEach
  //     undefined, // fromDate from findDateRange
  //     undefined, // toDate from findDateRange
  //     1, // default page
  //     10, // default pageSize
  //     mockReq.correlationId,
  //   );
  //   expect(mockRes.send).toHaveBeenCalled();
  // });

  // it("should return empty users array if usersByIds returns null", async () => {
  //   extractStatusParam.mockReturnValue("0");
  //   // isFutureDate.mockReturnValue(false); // from beforeEach

  //   // Provide some dates to pass initial checks
  //   const fromStr = "2023-01-01T00:00:00.000Z";
  //   const toStr = "2023-01-05T00:00:00.000Z";
  //   extractFromParam.mockReturnValue(fromStr);
  //   extractToParam.mockReturnValue(toStr);
  //   const fromDateObj = new Date(fromStr);
  //   const toDateObj = new Date(toStr);
  //   findDateRange.mockReturnValue({
  //     fromDate: fromDateObj,
  //     toDate: toDateObj,
  //     isWarning: false,
  //   });

  //   listServiceUsers.mockResolvedValue({
  //     users: [{ id: "user1" }], // Simulate a successful first call
  //     totalNumberOfRecords: 1,
  //     page: 1,
  //     totalNumberOfPages: 1,
  //   });
  //   usersByIds.mockResolvedValue(null); // Simulate no users found by Id (sub)

  //   const expectedBody = {
  //     users: [],
  //     numberOfRecords: 0,
  //     page: 0,
  //     numberOfPages: 0,
  //   };

  //   await listUsersWithFilters(mockReq, mockRes);

  //   expect(mockRes.send).toHaveBeenCalledWith(expectedBody);
  //   expect(addAddionalMessage).toHaveBeenCalledWith(
  //     expectedBody,
  //     fromDateObj,
  //     toDateObj,
  //     DURATION,
  //     false,
  //   );
  //   expect(mockPrepareUserResponse).not.toHaveBeenCalled();
  // });

  // it("should handle empty user list from listServiceUsers and subsequently empty from usersByIds", async () => {
  //   extractStatusParam.mockReturnValue("0");
  //   const fromStr = "2023-01-01T00:00:00.000Z";
  //   const toStr = "2023-01-05T00:00:00.000Z";
  //   extractFromParam.mockReturnValue(fromStr);
  //   extractToParam.mockReturnValue(toStr);
  //   const fromDateObj = new Date(fromStr);
  //   const toDateObj = new Date(toStr);
  //   findDateRange.mockReturnValue({
  //     fromDate: fromDateObj,
  //     toDate: toDateObj,
  //     isWarning: false,
  //   });

  //   const pageOfServiceUsersEmpty = {
  //     users: [],
  //     totalNumberOfRecords: 0,
  //     page: 1,
  //     totalNumberOfPages: 0,
  //   };
  //   listServiceUsers.mockResolvedValue(pageOfServiceUsersEmpty);
  //   usersByIds.mockResolvedValue([]); // usersByIds called with "" and returns []

  //   const expectedResponseBody = {
  //     users: [],
  //     numberOfRecords: 0,
  //     page: 1,
  //     numberOfPages: 0,
  //   };
  //   mockPrepareUserResponse.mockReturnValue(expectedResponseBody); // Mock will be called with users: []

  //   await listUsersWithFilters(mockReq, mockRes);

  //   expect(listServiceUsers).toHaveBeenCalled();
  //   expect(usersByIds).toHaveBeenCalledWith("", mockReq.correlationId);
  //   expect(mockPrepareUserResponse).toHaveBeenCalledWith(
  //     pageOfServiceUsersEmpty,
  //     [],
  //   );
  //   expect(addAddionalMessage).toHaveBeenCalledWith(
  //     expectedResponseBody,
  //     fromDateObj,
  //     toDateObj,
  //     DURATION,
  //     false,
  //   );
  //   expect(mockRes.send).toHaveBeenCalledWith(expectedResponseBody);
  // });

  // it('should handle valid single "from" date correctly and pass isWarning if set by findDateRange', async () => {
  //   const fromStr = "2023-03-15T00:00:00.000Z";
  //   extractFromParam.mockReturnValue(fromStr);
  //   extractToParam.mockReturnValue(null); // No 'to' date
  //   // isFutureDate.mockReturnValue(false); // from beforeEach

  //   const fromDateObj = new Date(fromStr);
  //   findDateRange.mockReturnValue({
  //     // Simulate findDateRange setting a warning for single dates
  //     fromDate: fromDateObj,
  //     toDate: undefined,
  //     isWarning: true,
  //   });

  //   // Setup for a successful response flow
  //   const serviceUsersData = {
  //     users: [{ id: "s1" }],
  //     totalNumberOfRecords: 1,
  //     page: 1,
  //     totalNumberOfPages: 1,
  //   };
  //   listServiceUsers.mockResolvedValue(serviceUsersData);
  //   const usersData = [{ sub: "s1", email: "e1" }];
  //   usersByIds.mockResolvedValue(usersData);
  //   const preparedResponse = {
  //     users: [{ userId: "s1" }],
  //     numberOfRecords: 1,
  //     page: 1,
  //     numberOfPages: 1,
  //   };
  //   mockPrepareUserResponse.mockReturnValue(preparedResponse);

  //   await listUsersWithFilters(mockReq, mockRes);

  //   expect(mockRes.status).not.toHaveBeenCalledWith(400);
  //   // isFutureDate(fromDateObj) would be called and return false.
  //   expect(isFutureDate).toHaveBeenCalledTimes(1);
  //   expect(isFutureDate).toHaveBeenCalledWith(fromDateObj);

  //   expect(listServiceUsers).toHaveBeenCalled();
  //   expect(usersByIds).toHaveBeenCalled();
  //   expect(mockPrepareUserResponse).toHaveBeenCalled();
  //   expect(addAddionalMessage).toHaveBeenCalledWith(
  //     preparedResponse,
  //     fromDateObj,
  //     undefined,
  //     DURATION,
  //     true,
  //   );
  //   expect(mockRes.send).toHaveBeenCalledWith(preparedResponse);
  // });

  // it('should handle valid single "to" date correctly and pass isWarning if set by findDateRange', async () => {
  //   const toStr = "2023-03-20T00:00:00.000Z";
  //   extractFromParam.mockReturnValue(null); // No 'from' date
  //   extractToParam.mockReturnValue(toStr);
  //   // isFutureDate.mockReturnValue(false); // from beforeEach

  //   const toDateObj = new Date(toStr);
  //   findDateRange.mockReturnValue({
  //     fromDate: undefined,
  //     toDate: toDateObj,
  //     isWarning: true, // Simulate findDateRange setting a warning
  //   });

  //   const serviceUsersData = {
  //     users: [{ id: "s2" }],
  //     totalNumberOfRecords: 1,
  //     page: 1,
  //     totalNumberOfPages: 1,
  //   };
  //   listServiceUsers.mockResolvedValue(serviceUsersData);
  //   const usersData = [{ sub: "s2", email: "e2" }];
  //   usersByIds.mockResolvedValue(usersData);
  //   const preparedResponse = {
  //     users: [{ userId: "s2" }],
  //     numberOfRecords: 1,
  //     page: 1,
  //     numberOfPages: 1,
  //   };
  //   mockPrepareUserResponse.mockReturnValue(preparedResponse);

  //   await listUsersWithFilters(mockReq, mockRes);

  //   expect(mockRes.status).not.toHaveBeenCalledWith(400);
  //   // isFutureDate(toDateObj) would be called and return false.
  //   expect(isFutureDate).toHaveBeenCalledTimes(1);
  //   expect(isFutureDate).toHaveBeenCalledWith(toDateObj);

  //   expect(listServiceUsers).toHaveBeenCalled();
  //   expect(addAddionalMessage).toHaveBeenCalledWith(
  //     preparedResponse,
  //     undefined,
  //     toDateObj,
  //     DURATION,
  //     true,
  //   );
  //   expect(mockRes.send).toHaveBeenCalledWith(preparedResponse);
  // });
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
