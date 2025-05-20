const logger = require("../../infrastructure/logger");
const {
  getOrganisationByTypeAndIdentifier,
} = require("../../infrastructure/organisations");
const { getServiceUsers } = require("../../infrastructure/access");
const { getUsersRaw } = require("login.dfe.api-client/users");

const getUsersByRoles = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const roles = req.query.roles ? req.query.roles.split(",") : null;
  const email = req.query.email ? req.query.email : null;
  const userId = req.query.userId ? req.query.userId : null;

  try {
    logger.info(
      `Getting users for UKPRN/UPIN ${req.params.id} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`,
      {
        correlationId,
        clientCorrelationId,
      },
    );
    if (!req.client.id || !req.params.id) {
      return res.status(400).send();
    }
    // Get organisations by UKPRN/UPIN
    let isUPIN = false;
    let organisations = await getOrganisationByTypeAndIdentifier(
      "UKPRN-multi",
      req.params.id,
      correlationId,
    );

    if (organisations.length === 0) {
      organisations = await getOrganisationByTypeAndIdentifier(
        "UPIN-multi",
        req.params.id,
        correlationId,
      );
      organisations = [].concat(organisations);
      isUPIN = true;
    }

    if (!organisations || organisations.length === 0) {
      return res.status(404).send();
    }

    // loop through all organisations found with that UKPRN and build the result
    let users = [];

    for (const organisation of organisations) {
      // Get all users associated with that service
      const serviceUsers = await getServiceUsers(
        req.client.id,
        organisation.id,
        correlationId,
      );
      let userIdNRoles;
      let usersDetails;

      if (serviceUsers && serviceUsers.services) {
        if (roles) {
          userIdNRoles = serviceUsers.services
            .filter((f) => f.roles.find((role) => roles.includes(role.code)))
            .map((user) => ({
              id: user.userId,
              roles: user.roles.map((role) => role.code),
            }));
        } else {
          userIdNRoles = serviceUsers.services.map((user) => ({
            id: user.userId,
            roles: user.roles.map((role) => role.code),
          }));
        }
        // Get user details by user ids
        if (userIdNRoles && userIdNRoles.length) {
          const userIds = userIdNRoles.map((ids) => ids.id);
          usersDetails = await getUsersRaw({ by: { userIds: userIds } });
          if (email !== null && email.length > 1) {
            usersDetails = usersDetails.filter(
              (user) => user.email.toLowerCase() === email.toLowerCase(),
            );
          }
          if (userId !== null && userId.length > 1) {
            usersDetails = usersDetails.filter(
              (user) => user.sub.toLowerCase() === userId.toLowerCase(),
            );
          }
          const newUsers = usersDetails.map((user) => {
            const role = userIdNRoles.find((ids) => ids.id === user.sub);
            return {
              email: user.email,
              firstName: user.given_name,
              lastName: user.family_name,
              userStatus: user.status,
              roles: role ? role.roles : null,
            };
          });
          users = users.concat(newUsers);
        }
      }
    }
    if (users.length) {
      // This should be factored out into its own function for easier unit testing and comments
      const result = [];
      // Loop over the users, remove duplicate records (by email) and combine the roles of these duplicate records
      users.forEach((user) => {
        // existing equals all the users that have an email equal to the current user in the loop. Multiple records with the same
        // email can result in existing having mutiple records
        const existing = users.filter((item) => user.email === item.email);
        // This if statement can probably be removed.  It will never not have at least 1 value in it.
        if (existing.length) {
          // existingIndex is -1 value if there is NOT another object matching existing[0] in results
          const existingIndex = result.indexOf(existing[0]);
          if (existingIndex !== -1) {
            // result[1].roles becomes the deduped array of roles between result[1] and the currently searched user
            result[existingIndex].roles = [
              ...new Set([...result[existingIndex].roles, ...user.roles]),
            ];
          } else {
            // If nothing in existing matches an object in result, then push it because it must be unique
            result.push(existing[0]);
          }
        }
      });
      const ukprnOrUpin = isUPIN ? "upin" : "ukprn";
      return res.json({ [ukprnOrUpin]: req.params.id, users: result });
    }
    // return 404 if no users found
    return res.status(404).send();
  } catch (e) {
    logger.info(
      `Error getting users for UKPRN/UPIN ${req.params.id} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};
module.exports = getUsersByRoles;
