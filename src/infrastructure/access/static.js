const getUsersAccessToServiceAtOrganisation = async (uid, sid, oid, correlationId) => {
  return {
    userId: uid,
    serviceId: sid,
    organisationId: oid,
    roles: [],
    identifiers: [],
    accessGrantedOn: '2018-08-17T15:44:16Z'
  };
};

const getPoliciesOfService = async (sid, correlationId) => {
  return Promise.resolve();
};
const getServiceUsers = async (sid, oid, correlationId) => {
  return Promise.resolve();
}

const getRoles = async (sid,correlationId) => {
  return Promise.resolve();
}

const getServiceUsersV2 = async (sid, oid, roleIds, page, pageSize, correlationId) => {
  return Promise.resolve();
}
module.exports = {
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
  getServiceUsers,
  getRoles,
  getServiceUsersV2
};
