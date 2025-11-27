const {
  extractPageParam,
  extractPageSizeParam,
  extractStatusParam,
  extractFromParam,
  extractToParam,
} = require("../utils");
const { getUsersRaw } = require("login.dfe.api-client/users");
const {
  getFilteredServiceUsersRaw,
  getServiceUsersPostRaw,
} = require("login.dfe.api-client/services");

const mapRoleData = (roleData) => {
  if (!roleData) {
    return [];
  }
  const roles = [];
  roleData.roles.forEach((role) => {
    roles.push({
      id: role.id,
      name: role.name,
      code: role.code,
      numericId: role.numericId,
      status: role.status.id,
    });
  });
  return roles;
};

const handleInternalError = (res, err, fallbackMessage) => {
  console.error(err);
  const message =
    err && err.message
      ? err.message
      : fallbackMessage || "Internal server error";
  return res.status(500).send(message);
};

const listUsers = async (req, res) => {
  const status = extractStatusParam(req);
  const to = extractToParam(req);
  const from = extractFromParam(req);

  if (status || from || to) {
    return listUsersWithFilters(req, res);
  } else {
    return listUsersWithOutFilters(req, res);
  }
};

const listUsersWithOutFilters = async (req, res) => {
  let page;
  let pageSize;

  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  let pageOfUserServices;
  try {
    pageOfUserServices = await getFilteredServiceUsersRaw({
      serviceId: req.client.id,
      pageNumber: page,
      pageSize,
    });
  } catch (err) {
    return handleInternalError(res, err, "Failed to fetch service users");
  }

  // Validate requested page is within the available range
  if (
    typeof page === "number" &&
    Number.isFinite(page) &&
    typeof pageOfUserServices?.totalNumberOfPages === "number" &&
    page > pageOfUserServices.totalNumberOfPages
  ) {
    return res
      .status(400)
      .send("Page number is greater than total number of pages");
  }

  const userIds = Array.isArray(pageOfUserServices?.users)
    ? pageOfUserServices.users.map((u) => u.id).filter(Boolean)
    : [];

  const fetchUsersAndRoles = async (ids) => {
    if (!ids || ids.length === 0) {
      return { users: [], userDataWithRoles: { services: [] } };
    }
    const users = await getUsersRaw({ by: { userIds: ids } });
    const userDataWithRoles = await getServiceUsersPostRaw({
      serviceId: req.client.id,
      userIds: ids,
    });
    return { users, userDataWithRoles };
  };

  try {
    const { users, userDataWithRoles } = await fetchUsersAndRoles(userIds);

    const responseBody = prepareUserResponse(
      pageOfUserServices,
      users,
      userDataWithRoles,
    );

    return res.send(responseBody);
  } catch (err) {
    return handleInternalError(res, err, "Failed to fetch user data");
  }
};

const validateFilterParams = (status, fromDate, toDate, duration) => {
  if (status !== undefined && status !== null) {
    if (status !== "0" && status !== "1") {
      return "Status is not valid. Should be either 0 or 1.";
    }
  }

  if (fromDate && toDate) {
    if (isFutureDate(fromDate) && isFutureDate(toDate)) {
      return "Date range should not be in the future";
    }

    if (fromDate.getTime() > toDate.getTime()) {
      return "From date greater than to date";
    }

    const time_difference = toDate.getTime() - fromDate.getTime();
    const days_difference = Math.abs(time_difference) / (1000 * 60 * 60 * 24);
    if (days_difference > duration) {
      return `Only ${duration} days are allowed between dates`;
    }
  } else if (fromDate || toDate) {
    const selectedDate = fromDate ?? toDate;
    if (selectedDate && isFutureDate(selectedDate)) {
      return "Date range should not be in the future";
    }
  }

  return null;
};

const parseDateParam = (dateString) => {
  if (!dateString) {
    return undefined;
  }
  const parsed = Date.parse(dateString);
  if (isNaN(parsed)) {
    return null;
  }
  return new Date(parsed);
};

const listUsersWithFilters = async (req, res) => {
  let page;
  let pageSize;
  let status;
  let fromDate;
  let toDate;
  const duration = 90;

  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
    status = extractStatusParam(req);
    const to = extractToParam(req);
    const from = extractFromParam(req);

    toDate = parseDateParam(to);
    if (to && toDate === null) {
      return res.status(400).send("To date is not a valid date.");
    }

    fromDate = parseDateParam(from);
    if (from && fromDate === null) {
      return res.status(400).send("From date is not a valid date.");
    }

    const validationError = validateFilterParams(
      status,
      fromDate,
      toDate,
      duration,
    );
    if (validationError) {
      return res.status(400).send(validationError);
    }
  } catch (e) {
    return res.status(400).send(e.message);
  }

  let isWarning = false;
  ({ toDate, fromDate, isWarning } = findDateRange(
    toDate,
    fromDate,
    duration,
    isWarning,
  ));

  // Convert to UTC ISO strings if defined
  const dateFromUTC = fromDate ? new Date(fromDate.toISOString()) : undefined;
  const dateToUTC = toDate ? new Date(toDate.toISOString()) : undefined;

  let pageOfUserServices;
  try {
    pageOfUserServices = await getFilteredServiceUsersRaw({
      serviceId: req.client.id,
      userStatus: status,
      dateFrom: dateFromUTC,
      dateTo: dateToUTC,
      pageNumber: page,
      pageSize,
    });
  } catch (err) {
    return handleInternalError(res, err, "Failed to fetch service users");
  }

  // Validate requested page is within the available range
  if (
    typeof page === "number" &&
    Number.isFinite(page) &&
    typeof pageOfUserServices?.totalNumberOfPages === "number" &&
    page > pageOfUserServices.totalNumberOfPages
  ) {
    return res
      .status(400)
      .send("Page number is greater than total number of pages");
  }

  const userIds = Array.isArray(pageOfUserServices?.users)
    ? pageOfUserServices.users.map((u) => u.id).filter(Boolean)
    : [];

  const fetchUsersAndRoles = async (ids) => {
    if (!ids || ids.length === 0) {
      return { users: [], userDataWithRoles: { services: [] } };
    }
    const users = await getUsersRaw({ by: { userIds: ids } });
    const userDataWithRoles = await getServiceUsersPostRaw({
      serviceId: req.client.id,
      userIds: ids,
    });
    return { users, userDataWithRoles };
  };

  try {
    const { users, userDataWithRoles } = await fetchUsersAndRoles(userIds);

    const responseBody =
      users && users.length > 0
        ? prepareUserResponse(pageOfUserServices, users, userDataWithRoles)
        : {
            users: [],
            numberOfRecords: 0,
            page: 0,
            numberOfPages: 0,
          };

    addDateRangeValue(responseBody, dateFromUTC, dateToUTC);
    addWarningValue(responseBody, duration, isWarning);
    return res.send(responseBody);
  } catch (err) {
    return handleInternalError(res, err, "Failed to fetch user data");
  }
};

const prepareUserResponse = (pageOfUserServices, users, userDataWithRoles) => {
  const mappedRecords = pageOfUserServices.users.map((userService) => {
    const user = users.find((u) => u.sub === userService.id);
    const serviceRoles = mapRoleData(
      userDataWithRoles.services.find(
        (role) =>
          role.userId === userService.id &&
          role.organisationId === userService.organisation.id,
      ),
    );
    let mappedUserService = {
      approvedAt: userService.createdAt
        ? new Date(userService.createdAt).toISOString()
        : undefined,
      updatedAt: userService.updatedAt
        ? new Date(userService.updatedAt).toISOString()
        : undefined,
      organisation: userService.organisation,
      roles: serviceRoles,
      roleName:
        userService.role && userService.role.name
          ? userService.role.name
          : undefined,
      roleId:
        userService.role && userService.role.id
          ? userService.role.id
          : undefined,
      userId: userService.id,
    };
    if (user) {
      mappedUserService = Object.assign(
        {
          ...mappedUserService,
        },
        {
          email: user.email,
          familyName: user.family_name,
          givenName: user.given_name,
          userStatus: user.status,
        },
      );
    }
    return mappedUserService;
  });

  return {
    users: mappedRecords,
    numberOfRecords: pageOfUserServices.totalNumberOfRecords,
    page: pageOfUserServices.page,
    numberOfPages: pageOfUserServices.totalNumberOfPages,
  };
};

/**
 * Add `dateRange` key with a human readable message representing the range of dates requested
 * to object if both `fromDate` and `toDate` are present
 */
const addDateRangeValue = (responseBody, fromDate, toDate) => {
  if (fromDate && toDate) {
    responseBody.dateRange = `Users between ${fromDate.toUTCString()} and ${toDate.toUTCString()}`;
  }
};

/**
 * Add `warning` key with a message to object if `isWarning` is true
 */
const addWarningValue = (responseBody, duration, isWarning) => {
  if (isWarning) {
    responseBody.warning = `Only ${duration} days of data can be fetched`;
  }
};

const isFutureDate = (inputDate) => {
  return inputDate.getTime() > new Date().getTime();
};

const findDateRange = (toDate, fromDate, duration, isWarning) => {
  if (toDate && !fromDate) {
    fromDate = new Date(toDate);
    fromDate.setUTCDate(toDate.getUTCDate() - duration);
    isWarning = true;
  } else if (!toDate && fromDate) {
    toDate = new Date(fromDate);
    toDate.setUTCDate(fromDate.getUTCDate() + duration);
    isWarning = true;
  } else if (!toDate && !fromDate) {
    toDate = new Date();
    fromDate = new Date();
    fromDate.setUTCDate(fromDate.getUTCDate() - duration);
    isWarning = true;
  }
  return { toDate, fromDate, isWarning };
};

module.exports = listUsers;
