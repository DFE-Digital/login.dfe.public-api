const logger = require("./../../infrastructure/logger");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getUsersRaw } = require("login.dfe.api-client/users");
const {
  getServiceUsersForOrganisationRaw,
  getServiceUsersWithRolesForOrganisationRaw,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");

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
    const organisation = await getOrganisationRaw({
      by: { type: "UKPRN", identifierValue: ukprn },
    });

    if (!organisation) {
      return res.status(404).send();
    }
    // Get Roles by RoleCode
    let serviceUsers = null;
    if (roles) {
      const allRoles = await getServiceRolesRaw({ serviceId: req.client.id });
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
        serviceUsers = await getServiceUsersWithRolesForOrganisationRaw({
          organisationId: organisation.id,
          serviceId: req.client.id,
          serviceRoleIds: serviceRoleIds,
          page: page,
          pageSize: pageSize,
        });
      }
    } else {
      serviceUsers = await getServiceUsersForOrganisationRaw({
        organisationId: organisation.id,
        serviceId: req.client.id,
      });
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
  const userIdList = userIds.split(",");
  const usersDetails = await getUsersRaw({ by: { userIds: userIdList } });
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
