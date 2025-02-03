jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").mockLogger(),
);
jest.mock("../../../src/infrastructure/access");
jest.mock("../../../src/infrastructure/directories");
jest.mock("../../../src/infrastructure/organisations");

const { mockResponse, mockRequest } = require("../../utils");
const { getServicesForUser } = require("../../../src/infrastructure/access");
const {
  listServiceUsers,
} = require("../../../src/infrastructure/organisations");
const { usersByIds } = require("../../../src/infrastructure/directories");
const getUsersOrganisationsAndServices = require("../../../src/app/users/getUsersOrganisationsAndServices");

const res = mockResponse();

describe("when getting users organisations and services", () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      params: {
        id: "user-1",
      },
    });
    res.mockResetAll();

    usersByIds.mockReset().mockReturnValue([
      {
        email: "test@example.com",
      },
    ]);

    console.log(listServiceUsers);

    listServiceUsers.mockReset().mockReturnValue({
      users: [
        {
          id: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
          status: 1,
          role: { id: 10000, name: "Approver" },
          createdAt: "2025-01-23T12:04:07.455Z",
          updatedAt: "2025-01-23T12:04:07.455Z",
          organisation: {
            id: "3DE9D503-6609-4239-BA55-14F8EBD69F56",
            name: "Department for Education",
            LegalName: null,
            Category: "002",
            Type: null,
            URN: null,
            UID: "123",
            UKPRN: null,
            EstablishmentNumber: "001",
            Status: 1,
            ClosedOn: null,
            Address: null,
            phaseOfEducation: null,
            statutoryLowAge: null,
            statutoryHighAge: null,
            telephone: null,
            regionCode: null,
            legacyId: "1031237",
            companyRegistrationNumber: null,
            DistrictAdministrativeName: null,
            DistrictAdministrativeCode: null,
            DistrictAdministrative_code: null,
            ProviderProfileID: null,
            UPIN: null,
            ProviderTypeName: null,
            ProviderTypeCode: null,
            SourceSystem: null,
            GIASProviderType: null,
            PIMSProviderType: null,
            PIMSProviderTypeCode: null,
            PIMSStatus: null,
            masteringCode: null,
            OpenedOn: null,
            PIMSStatusName: null,
            GIASStatus: null,
            GIASStatusName: null,
            MasterProviderStatusCode: null,
            MasterProviderStatusName: null,
            IsOnAPAR: null,
          },
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 1,
    });

    getServicesForUser.mockReset().mockReturnValue([
      {
        userId: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
        serviceId: "4FD40032-61A6-4BEB-A6C4-6B39A3AF81C1",
        organisationId: "05E12438-5278-40F8-BD83-937D2CC7489F",
        roles: [],
        identifiers: [],
        accessGrantedOn: "2024-10-04T15:49:02Z",
      },
      {
        userId: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
        serviceId: "28388AEB-431B-49BC-9480-8DB1B0BDD6E1",
        organisationId: "3DE9D503-6609-4239-BA55-14F8EBD69F56",
        roles: [],
        identifiers: [],
        accessGrantedOn: "2025-01-23T12:04:07Z",
      },
    ]);
  });

  it("then it should return 404 if the user isn't found", async () => {
    usersByIds.mockReset().mockReturnValue(undefined);
    await getUsersOrganisationsAndServices(req, res);

    expect(res.status.mock.calls[0][0]).toBe(404);
  });

  // it("then it should return mapped users organisations", async () => {
  //   await getUsersOrganisationsAndServices(req, res);

  //   expect(res.send).toHaveBeenCalledTimes(1);
  //   expect(res.send.mock.calls[0][0]).toMatchObject([
  //     {
  //       id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
  //       name: "Some org",
  //       status: {
  //         id: 1,
  //         name: "Open",
  //       },
  //     },
  //   ]);
  // });
});
