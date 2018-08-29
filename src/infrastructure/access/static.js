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

module.exports = {
  getUsersAccessToServiceAtOrganisation,
};
