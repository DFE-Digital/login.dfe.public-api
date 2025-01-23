const logger = require("../../infrastructure/logger");
const {
  getOrganisationsAssociatedWithUserV2,
  listServiceUsers,
} = require("../../infrastructure/organisations");
const { usersByIds } = require("../../infrastructure/directories");
const { padEnd } = require("lodash");

const getUsersOrganisationsAndServices = async (req, res) => {
  const uid = req.params.id;
  const { correlationId, clientCorrelationId } = req;
  try {
    logger.info(
      `Getting organisations for user ${uid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    // Call to get user details
    const userDetails = await usersByIds(uid, correlationId);
    console.log(userDetails);

    const userOrganisations = await getOrganisationsAssociatedWithUserV2(
      uid,
      correlationId,
    );
    console.log("---------- user orgs");
    console.log(userOrganisations[0]);
    if (!userOrganisations) {
      return res.status(404).send();
    }
    // Call to get services for user (listServiceUsers, I think this also gets roles too?)
    const pageOfUserServices = await listServiceUsers(
      req.client.id,
      [uid],
      1,
      50,
      req.correlationId,
    );
    console.log("---------- page of user services");
    console.log(pageOfUserServices);
    //console.log(pageOfUserServices.users[0]);

    // Shape data to expected
    let response = userDetails[0];
    const mappedOrgs = pageOfUserServices.users.map((x) => x.organisation);
    console.log("mapped orgs");
    console.log(mappedOrgs);
    response["organisation"] = mappedOrgs;
    // response.organisations = pageOfUserServices.users[x]
    // response.organisations.services = pageOfUserServices.users[x] (but minus the organisation detail)
    //const organisations = userOrganisations.map((x) => x.organisation);
    return res.send(response);
  } catch (e) {
    logger.info(
      `Error getting organisations for user ${uid} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

module.exports = getUsersOrganisationsAndServices;
