jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").mockLogger(),
);
jest.mock("../../../src/infrastructure/access");
jest.mock("../../../src/infrastructure/directories");
jest.mock("../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/users");

const { mockResponse, mockRequest } = require("../../utils");
const {
  getServicesForUser,
  getRoles,
} = require("../../../src/infrastructure/access");
const {
  listServiceUsers,
  getServiceById,
  getOrganisationCategories,
  getOrganisationStatuses,
} = require("../../../src/infrastructure/organisations");
const { getUserRaw } = require("login.dfe.api-client/users");
const getUsersOrganisationsAndServices = require("../../../src/app/users/getUsersOrganisationsAndServices");

const res = mockResponse();

const organisationCategoryData = [
  { id: "052", name: "Billing Authority" },
  { id: "001", name: "Establishment" },
  { id: "011", name: "Government" },
  { id: "002", name: "Local Authority" },
  { id: "010", name: "Multi-Academy Trust" },
  { id: "012", name: "Other GIAS Stakeholder" },
  { id: "003", name: "Other Legacy Organisations" },
  { id: "008", name: "Other Stakeholders" },
  { id: "051", name: "PIMS Training Providers" },
  { id: "014", name: "Secure Single-Academy Trust" },
  { id: "013", name: "Single-Academy Trust" },
  { id: "050", name: "Software Suppliers" },
  { id: "009", name: "Training Providers" },
  { id: "053", name: "Youth Custody Service" },
];

const organisationStatusData = [
  { id: 2, name: "Closed", tagColor: "red" },
  { id: 9, name: "Created in error", tagColor: "red" },
  { id: 5, name: "Dissolved", tagColor: "red" },
  { id: 0, name: "Hidden", tagColor: "grey" },
  { id: 6, name: "In Liquidation", tagColor: "red" },
  { id: 8, name: "Locked Duplicate", tagColor: "purple" },
  { id: 10, name: "Locked Restructure", tagColor: "purple" },
  { id: 1, name: "Open", tagColor: "green" },
  { id: 3, name: "Proposed to close", tagColor: "orange" },
  { id: 4, name: "Proposed to open", tagColor: "blue" },
];

describe("when getting users organisations and services", () => {
  let req;

  beforeEach(() => {
    req = mockRequest({
      client: {
        id: "serviceId",
      },
      params: {
        id: "user-1",
      },
    });
    res.mockResetAll();

    getUserRaw.mockReset().mockReturnValue({
      sub: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
      given_name: "Test",
      family_name: "User",
      email: "test@example.com",
      job_title: null,
      status: 1,
      phone_number: null,
    });

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
        organisationId: "3DE9D503-6609-4239-BA55-14F8EBD69F56",
        roles: [
          {
            id: "0B8625A7-43CB-433C-9991-00331879251B",
            name: "School Experience - Service Configuration",
            code: "EF32DA2F-92C3-4E7E-A9D4-2E588F6F9A74_serviceconfig",
            numericId: "21871",
            status: [],
          },
          {
            id: "797B1672-6718-40E7-A4E9-003ABBFCCEE2",
            name: "Apprenticeship service for training providers - Service Banner",
            code: "DFBA978F-4E45-496F-8AC4-E27F18D0CE9D_serviceBanner",
            numericId: "22032",
            status: [],
          },
        ],
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

    getServiceById.mockReset().mockReturnValue({
      id: "B1F190AA-729A-45FC-A695-4EA209DC79D4",
      name: "DfE Sign-in manage",
      description: "DfE Sign-in Manage",
    });

    getRoles.mockReset().mockReturnValue([
      {
        id: "0B8625A7-43CB-433C-9991-00331879251B",
        name: "School Experience - Service Configuration",
        code: "EF32DA2F-92C3-4E7E-A9D4-2E588F6F9A74_serviceconfig",
        numericId: "21871",
        status: { id: 1 },
      },
      {
        id: "33D14953-6E58-4A11-A4C8-DC925BE6333C",
        name: "Academy Budget Forecast Return - Service Banner",
        code: "49FFFA46-BB7A-439A-B7A1-7CA00FF77456_serviceBanner",
        numericId: "22438",
        status: { id: 1 },
      },
    ]);

    getOrganisationCategories
      .mockReset()
      .mockReturnValue(organisationCategoryData);
    getOrganisationStatuses.mockReset().mockReturnValue(organisationStatusData);
  });

  it("then it should return 404 if the user isn't found", async () => {
    getUserRaw.mockReset().mockReturnValue(undefined);
    await getUsersOrganisationsAndServices(req, res);

    expect(res.status.mock.calls[0][0]).toBe(404);
  });

  it("then it should return 200 with empty organisations if listServiceUsers is empty", async () => {
    listServiceUsers.mockReset().mockReturnValue({
      users: [],
      page: 1,
      totalNumberOfPages: 0,
      totalNumberOfRecords: 0,
    });
    await getUsersOrganisationsAndServices(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      userId: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
      userStatus: 1,
      email: "test@example.com",
      familyName: "User",
      givenName: "Test",
      organisations: [],
    });
  });

  it("then it should return 200 if the user is found", async () => {
    await getUsersOrganisationsAndServices(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toMatchObject({
      userId: "6BEA40AE-947D-4767-9A97-C52FCED78B33",
      userStatus: 1,
      email: "test@example.com",
      familyName: "User",
      givenName: "Test",
      organisations: [
        {
          DistrictAdministrativeName: null,
          GIASProviderType: null,
          OpenedOn: null,
          PIMSProviderType: null,
          PIMSProviderTypeCode: null,
          PIMSStatus: null,
          ProviderProfileID: null,
          ProviderTypeName: null,
          SourceSystem: null,
          UPIN: null,
          address: null,
          category: { id: "002", name: "Local Authority" },
          closedOn: null,
          companyRegistrationNumber: null,
          establishmentNumber: "001",
          id: "3DE9D503-6609-4239-BA55-14F8EBD69F56",
          legacyId: "1031237",
          name: "Department for Education",
          orgRoleId: 10000,
          orgRoleName: "Approver",
          services: [
            {
              description: "DfE Sign-in Manage",
              name: "DfE Sign-in manage",
              roles: [
                {
                  code: "EF32DA2F-92C3-4E7E-A9D4-2E588F6F9A74_serviceconfig",
                  name: "School Experience - Service Configuration",
                },
              ],
            },
            {
              description: "DfE Sign-in Manage",
              name: "DfE Sign-in manage",
              roles: [],
            },
          ],
          status: { id: 1, name: "Open" },
          statutoryHighAge: null,
          statutoryLowAge: null,
          telephone: null,
          uid: "123",
          ukprn: null,
          urn: null,
        },
      ],
    });
  });

  it("then it raise an exception if an exception is raised on any api call", async () => {
    getUserRaw.mockReset().mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await getUsersOrganisationsAndServices(req, res);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
