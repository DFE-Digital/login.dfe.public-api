const logger = require("./../../infrastructure/logger");
const {
  getOrganisationByTypeAndIdentifier,
} = require("../../infrastructure/organisations");
const {
  getServiceUsersForOrganisation,
  getRoles,
  getServiceUsersForOrganisationV2,
} = require("../../infrastructure/access");
const { usersByIds } = require("../../infrastructure/directories");

const getPageNumber = (req) => {
  const pageValue = req.query.page;
  if (!pageValue) {
    return 1;
  }
  const page = parseInt(pageValue);
  if (isNaN(page)) {
    throw new Error("Page must be a number");
  } else if (page < 1) {
    throw new Error("Page must be at least 1");
  }
  return page;
};
const getPageSize = (req) => {
  const pageSizeValue = req.query.pageSize;
  if (!pageSizeValue) {
    return 25;
  }
  const page = parseInt(pageSizeValue);
  if (isNaN(page)) {
    throw new Error("Page size must be a number");
  } else if (page < 1) {
    throw new Error("Page size must be at least 1");
  }
  return page;
};

const getUserOverview = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const { roles } = req.query;
  const ukprn = req.params.id;
  let page, pageSize;
  try {
    page = getPageNumber(req);
    pageSize = getPageSize(req);
  } catch (e) {
    return res.status(400).json({
      reasons: [e.message],
    });
  }

  try {
    logger.info(
      `Getting users for UKPRN ${req.params.id} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`,
      {
        correlationId,
        clientCorrelationId,
      },
    );
    if (!req.client.id || !req.params.id) {
      return res.status(400).send();
    }
    // Get organisation_id by UKPRN
    const organisation = await getOrganisationByTypeAndIdentifier(
      "UKPRN",
      ukprn,
      correlationId,
    );
    if (!organisation) {
      return res.status(404).send();
    }
    // Get Roles by RoleCode
    let serviceUsers = null;
    if (roles) {
      const allRoles = await getRoles(req.client.id, correlationId);
      const serviceRoleIds = allRoles
        .filter((role) => {
          const r = roles
            .split(",")
            .filter((r) => r.toLowerCase() === role.code.toLowerCase());
          if (r && r.length > 0) {
            return true;
          } else {
            return false;
          }
        })
        .map((m) => m.id);
      if (serviceRoleIds && serviceRoleIds.length > 0) {
        serviceUsers = await getServiceUsersForOrganisationV2(
          req.client.id,
          organisation.id,
          serviceRoleIds,
          page,
          pageSize,
          correlationId,
        );
      }
    } else {
      serviceUsers = await getServiceUsersForOrganisation(
        req.client.id,
        organisation.id,
        correlationId,
      );
    }
    if (serviceUsers) {
      const userIds = serviceUsers.services.map((ids) => ids.userId);
      const result = await getUserDetails(req, userIds.join(","));
      return res.json({
        page: serviceUsers.page,
        totalPages: serviceUsers.totalNumberOfPages,
        totalRecords: serviceUsers.totalNumberOfRecords,
        result,
      });
    } else {
      return res.status(404).send();
    }
  } catch (e) {
    logger.info(
      `Error getting users for UKPRN ${req.params.id} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

const getUserDetails = async (req, userIds) => {
  const usersDetails = await usersByIds(userIds, req.correlationId);
  if (usersDetails && usersDetails.length > 0) {
    return usersDetails.map((user) => {
      return {
        emails: [user.email],
        "name.givenname": [user.given_name],
        "name.familyname": [user.family_name],
        Title: [""],
      };
    });
  } else {
    return null;
  }
};

module.exports = getUserOverview;
