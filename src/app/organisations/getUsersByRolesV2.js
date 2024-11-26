const logger = require('../../infrastructure/logger');
const {
  getOrganisationByTypeAndIdentifier,
  getUsersForOrganisation,
} = require('../../infrastructure/organisations');
const { getServiceUsers } = require('../../infrastructure/access');
const { usersByIds } = require('../../infrastructure/directories');

const getUsersByRolesV2 = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const roles = req.query.roles?.split(',') || null;
  const email = req.query.email || null;
  const userId = req.query.userId || null;
  const ukprnOrUpin = req.params.id;
  const clientId = req.client?.id;

  if (!clientId || !ukprnOrUpin) {
    return res.status(400).send();
  }

  try {
    logger.info(`Fetching users for ID ${ukprnOrUpin} (correlationId: ${correlationId}, clientCorrelationId: ${clientCorrelationId})`);

    // Fetch organisations by UKPRN or UPIN
    const { organisations, isUPIN } = await fetchOrganisationsByIdentifier(ukprnOrUpin, correlationId);

    if (!organisations || organisations.length === 0) {
      return res.status(404).send();
    }

    // Collect and process users across organisations
    const allUsers = [];
    for (const organisation of organisations) {
      const orgUsers = await processOrganisationUsers(clientId, organisation.id, correlationId, roles, email, userId);
      allUsers.push(...orgUsers);
    }

    // Deduplicate and combine roles
    const deduplicatedUsers = deduplicateUsersByEmail(allUsers);

    if (deduplicatedUsers.length > 0) {
      return res.json({ [isUPIN ? 'upin' : 'ukprn']: ukprnOrUpin, users: deduplicatedUsers });
    }

    return res.status(404).send();
  } catch (e) {
    logger.error(
      `Error fetching users for ID ${ukprnOrUpin} (correlationId: ${correlationId}, clientCorrelationId: ${clientCorrelationId}) - ${e.message}`,
      { correlationId, clientCorrelationId, stack: e.stack }
    );
    res.status(500).send();
  }
};

// Helper function to fetch organisations by UKPRN or UPIN
const fetchOrganisationsByIdentifier = async (id, correlationId) => {
  let organisations = await getOrganisationByTypeAndIdentifier('UKPRN-multi', id, correlationId);
  let isUPIN = false;

  if (!organisations || organisations.length === 0) {
    organisations = await getOrganisationByTypeAndIdentifier('UPIN-multi', id, correlationId);
    isUPIN = true;
  }

  return { organisations, isUPIN };
};

// Helper function to process users for a single organisation
const processOrganisationUsers = async (clientId, organisationId, correlationId, roles, email, userId) => {
  const serviceUsers = await getServiceUsers(clientId, organisationId, correlationId);

  if (!serviceUsers || !serviceUsers.services) {
    return [];
  }

  // Filter users based on roles
  const filteredUsers = roles
    ? serviceUsers.services.filter((user) => user.roles.some((role) => roles.includes(role.code)))
    : serviceUsers.services;

  const userIds = filteredUsers.map((user) => user.userId);
  const userDetails = await usersByIds(userIds.join(','), correlationId);

  // Apply email and userId filters
  const filteredDetails = userDetails
    .filter((user) => (email ? user.email.toLowerCase() === email.toLowerCase() : true))
    .filter((user) => (userId ? user.sub.toLowerCase() === userId.toLowerCase() : true));

  const organisationUsers = await getUsersForOrganisation(organisationId, correlationId);

  return filteredDetails.map((user) => {
    const userRoles = filteredUsers.find((u) => u.userId === user.sub)?.roles.map((role) => role.code) || [];
    const orgUser = organisationUsers.find((orgUser) => orgUser.id === user.sub);
    return {
      email: user.email,
      firstName: user.given_name,
      lastName: user.family_name,
      userStatus: user.status,
      roles: userRoles,
      orgRole: orgUser?.role?.name || null,
    };
  });
};

// Helper function to deduplicate users by email and combine roles
const deduplicateUsersByEmail = (users) => {
  const uniqueUsers = [];

  users.forEach((user) => {
    const existingUser = uniqueUsers.find((u) => u.email === user.email);
    if (existingUser) {
      existingUser.roles = [...new Set([...existingUser.roles, ...user.roles])];
    } else {
      uniqueUsers.push(user);
    }
  });

  return uniqueUsers;
};

module.exports = getUsersByRolesV2;
