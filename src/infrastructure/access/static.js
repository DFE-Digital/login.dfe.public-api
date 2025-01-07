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
const getServiceUsers = async () => {
  return Promise.resolve();
};

const getRoles = async () => {
  return Promise.resolve();
};

const getServiceUsersV2 = async () => {
  return Promise.resolve();
};
module.exports = {
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
  getServiceUsers,
  getRoles,
  getServiceUsersV2,
};
