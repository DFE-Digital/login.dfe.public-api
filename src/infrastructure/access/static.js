const getUsersAccessToServiceAtOrganisation = async (uid, sid, oid) => {
  return {
    userId: uid,
    serviceId: sid,
    organisationId: oid,
    roles: [],
    identifiers: [],
    accessGrantedOn: "2018-08-17T15:44:16Z",
  };
};

const getPoliciesOfService = async () => {
  return Promise.resolve();
};
const getServiceUsersForOrganisation = async () => {
  return Promise.resolve();
};

const getRoles = async () => {
  return Promise.resolve();
};

const getServiceUsersForOrganisationV2 = async () => {
  return Promise.resolve();
};

const getServicesForUser = async () => {
  return Promise.resolve();
};
module.exports = {
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
  getServiceUsersForOrganisation,
  getRoles,
  getServiceUsersForOrganisationV2,
  getServicesForUser,
};
