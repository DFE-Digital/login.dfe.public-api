const getOrganisationByTypeAndIdentifier = async () => {
  return Promise.resolve({
    id: "1923215A-0CB7-4255-A602-000276541FB7",
    name: "North Thoresby Primary Academy",
    category: {
      id: "001",
      name: "Establishment",
    },
    type: {
      id: "34",
      name: "Academy Converter",
    },
    urn: "139868",
    uid: null,
    ukprn: "10042285",
    establishmentNumber: "2183",
    status: {
      id: 1,
      name: "Open",
    },
    closedOn: null,
    address: "High Street, North Thoresby, Grimsby, Lincolnshire, DN36 5PL",
    telephone: "01472840295",
    region: {
      id: "E",
      name: "East Midlands",
    },
    phaseOfEducation: {
      id: 2,
      name: "Primary",
    },
    statutoryLowAge: 4,
    statutoryHighAge: 11,
    legacyId: null,
    companyRegistrationNumber: null,
  });
};

const searchForAnnouncements = async () => {
  return Promise.resolve(undefined);
};

const upsertOrganisationAnnouncement = async () => {
  return Promise.resolve();
};

const getOrganisationsAssociatedWithUser = async () => {
  return Promise.resolve([
    {
      organisation: {
        id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        name: "Some org",
        status: {
          id: 1,
          name: "Open",
        },
      },
      role: {
        id: 0,
        name: "End user",
      },
    },
  ]);
};

const listOrganisationUsersV3 = async () => {
  return Promise.resolve();
};

const getUsersForOrganisation = async () => {
  return Promise.resolve();
};

const listServiceUsers = async () => {
  return Promise.resolve();
};

const getServiceById = async () => {
  return Promise.resolve();
};

const getOrganisationCategories = async () => {
  return Promise.resolve();
};

const getOrganisationStatuses = async () => {
  return Promise.resolve();
};

module.exports = {
  getOrganisationByTypeAndIdentifier,
  getUsersForOrganisation,
  searchForAnnouncements,
  upsertOrganisationAnnouncement,
  getOrganisationsAssociatedWithUser,
  listOrganisationUsersV3,
  listServiceUsers,
  getServiceById,
  getOrganisationCategories,
  getOrganisationStatuses,
};
