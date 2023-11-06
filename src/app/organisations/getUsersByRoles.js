const logger = require('../../infrastructure/logger');
const { getOrganisationByTypeAndIdentifier } = require('../../infrastructure/organisations');
const { getServiceUsers } = require('../../infrastructure/access');
const { usersByIds } = require('../../infrastructure/directories');

const getUsersByRoles = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const roles = req.query.roles ? req.query.roles.split(',') : null;

  try {
    logger.info(`Getting users for UKPRN/UPIN ${req.params.id} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`, {
      correlationId,
      clientCorrelationId,
    });
    if (!req.client.id || !req.params.id) {
      return res.status(400).send();
    }
    // Get organisations by UKPRN/UPIN
    let isUPIN = false;
    let organisations = await getOrganisationByTypeAndIdentifier('UKPRN-multi', req.params.id, correlationId);

    if (organisations.length === 0) {
      organisations = await getOrganisationByTypeAndIdentifier('UPIN-multi', req.params.id, correlationId);
      organisations = [].concat(organisations)
      isUPIN = true;
    }

    if (!organisations || organisations.length === 0) {
      return res.status(404).send();
    }

    // loop through all organisations found with that UKPRN and build the result
    let users = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const organisation of organisations) {
      // Get all users associated with that service
      const serviceUsers = await getServiceUsers(req.client.id, organisation.id, correlationId);
      let userIdNRoles;
      let usersDetails;

      if (serviceUsers && serviceUsers.services) {
        if (roles) {
          userIdNRoles = serviceUsers.services.filter((f) => f.roles.find((role) => roles.includes(role.code))).map((user) => ({ id: user.userId, roles: user.roles.map((role) => role.code) }));
        } else {
          userIdNRoles = serviceUsers.services.map((user) => ({ id: user.userId, roles: user.roles.map((role) => role.code) }));
        }
        // Get user details by user ids
        if (userIdNRoles && userIdNRoles.length) {
          const userIds = userIdNRoles.map((ids) => ids.id);
          usersDetails = await usersByIds(userIds.join(','), req.correlationId);
          const newUsers = usersDetails.map((user) => {
            const role = userIdNRoles.find((ids) => ids.id === user.sub);
            return {
              email: user.email, firstName: user.given_name, lastName: user.family_name, userStatus: user.status, roles: role ? role.roles : null,
            };
          });
          users = users.concat(newUsers);
        }
      }
    }
    if (users.length) {
      const result = [];
      users.forEach((user) => {
        const existing = users.filter((item) => user.email === item.email);
        if (existing.length) {
          const existingIndex = result.indexOf(existing[0]);
          if (existingIndex !== -1) {
            result[existingIndex].roles = [...new Set([...result[existingIndex].roles, ...user.roles])];
          } else {
            result.push(existing[0]);
          }
        }
      });
      ukprnOrUpin = isUPIN ? 'upin' : 'ukprn';
      return res.json(
        { [ukprnOrUpin]: req.params.id, users: result },
      );
    }
    // return 404 if no users found
    return res.status(404).send();
  } catch (e) {
    logger.info(`Error getting users for UKPRN/UPIN ${req.params.id} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`, {
      correlationId,
      clientCorrelationId,
      stack: e.stack,
    });
    throw e;
  }
};
module.exports = getUsersByRoles;
