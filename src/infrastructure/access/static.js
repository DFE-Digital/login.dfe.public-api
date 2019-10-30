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

module.exports = {
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
};
