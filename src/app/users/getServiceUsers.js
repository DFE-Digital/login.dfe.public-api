const {
  extractPageParam,
  extractPageSizeParam,
  extractStatusParam,
  extractFromParam,
  extractToParam,
} = require("../utils");
const { listServiceUsers } = require("../../infrastructure/organisations");
const { usersByIds } = require("../../infrastructure/directories");

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
  let users;

  pageOfUserServices = await listServiceUsers(
    req.client.id,
    null,
    undefined,
    undefined,
    undefined,
    page,
    pageSize,
    req.correlationId,
  );
  const userIds = pageOfUserServices.users.map((user) => user.id);
  users = await usersByIds(userIds.join(","), req.correlationId);

  const responseBody = prepareUserResponse(pageOfUserServices, users);

  return res.send(responseBody);
};

const listUsersWithFilters = async (req, res) => {
  let page;
  let pageSize;
  let status;
  let to;
  let from;
  let fromDate;
  let toDate;
  const duration = 7;

  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
    status = extractStatusParam(req);
    to = extractToParam(req);
    from = extractFromParam(req);

    if (status !== undefined && status !== null) {
      // Check if status is provided at all
      if (status !== "0" && status !== "1") {
        return res
          .status(400)
          .send("Status is not valid. Should be either 0 or 1.");
      }
    }

    if (to && isNaN(Date.parse(to))) {
      return res.status(400).send("To date is not a valid date.");
    } else if (to) {
      toDate = new Date(to);
    }
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).send("From date is not a valid date.");
    } else if (from) {
      fromDate = new Date(from);
    }

    if (fromDate && toDate) {
      if (isFutureDate(fromDate) && isFutureDate(toDate)) {
        return res.status(400).send("Date range should not be in the future");
      } else if (fromDate.getTime() > toDate.getTime()) {
        return res.status(400).send("From date greater than to date");
      }

      const time_difference = toDate.getTime() - fromDate.getTime();
      const days_difference = Math.abs(time_difference) / (1000 * 60 * 60 * 24);
      if (days_difference > duration) {
        return res
          .status(400)
          .send(`Only ${duration} days are allowed between dates`);
      }
    } else if (fromDate || toDate) {
      const selectedDate = fromDate ? fromDate : toDate;
      if (isFutureDate(selectedDate)) {
        return res.status(400).send("Date range should not be in the future");
      }
    }
  } catch (e) {
    return res.status(400).send(e.message);
  }

  let users;
  let pageOfUserServices;

  let isWarning = false;

  ({ toDate, fromDate, isWarning } = findDateRange(
    toDate,
    fromDate,
    duration,
    isWarning,
  ));

  try {
    pageOfUserServices = await listServiceUsers(
      req.client.id,
      undefined,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
      req.correlationId,
    );
  } catch (e) {
    // TODO change console.log for logger.error
    console.log(e);
    return res.status(400).send("Something went wrong getting service users");
  }

  const userIds = pageOfUserServices.users.map((user) => user.id);
  users = await usersByIds(userIds.join(","), req.correlationId);

  if (!users) {
    const responseBody = {
      users: [],
      numberOfRecords: 0,
      page: 0,
      numberOfPages: 0,
    };
    addAdditionalMessage(responseBody, fromDate, toDate, duration, isWarning);

    return res.send(responseBody);
  }

  const responseBody = prepareUserResponse(pageOfUserServices, users);

  addAdditionalMessage(responseBody, fromDate, toDate, duration, isWarning);
  return res.send(responseBody);
};

const prepareUserResponse = (pageOfUserServices, users) => {
  const mappedRecords = pageOfUserServices.users.map((userService) => {
    const user = users.find((u) => u.sub === userService.id);
    let mappedUserService = {
      approvedAt: userService.createdAt,
      updatedAt: userService.updatedAt,
      organisation: userService.organisation,
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
  const responseBody = {
    users: mappedRecords,
    numberOfRecords: pageOfUserServices.totalNumberOfRecords,
    page: pageOfUserServices.page,
    numberOfPages: pageOfUserServices.totalNumberOfPages,
  };

  return responseBody;
};

const addAdditionalMessage = (
  responseBody,
  fromDate,
  toDate,
  duration,
  isWarning,
) => {
  if (fromDate && toDate) {
    responseBody.dateRange = `Users between ${fromDate.toUTCString()} and ${toDate.toUTCString()}`;
  }

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
    fromDate.setDate(toDate.getDate() - duration);
    isWarning = true;
  } else if (!toDate && fromDate) {
    toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + duration);
    isWarning = true;
  } else if (!toDate && !fromDate) {
    toDate = new Date();
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - duration);
    isWarning = true;
  }
  return { toDate, fromDate, isWarning };
};

module.exports = listUsers;
