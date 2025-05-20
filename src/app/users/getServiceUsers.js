const {
  extractPageParam,
  extractPageSizeParam,
  extractStatusParam,
  extractFromParam,
  extractToParam,
} = require("../utils");
const { listServiceUsers } = require("../../infrastructure/organisations");
const { getUsersRaw } = require("login.dfe.api-client/users");
const { directories } = require("login.dfe.dao");

const listUsers = async (req, res) => {
  let status;
  let to;
  let from;

  try {
    status = extractStatusParam(req);
    to = extractToParam(req);
    from = extractFromParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }
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
    page,
    pageSize,
    req.correlationId,
  );
  const userIds = pageOfUserServices.users.map((user) => user.id);
  users = await getUsersRaw({ by: { userIds: userIds } });

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

    if (status && status !== "0") {
      return res.status(400).send("status should only be 0");
    }

    if (to && isNaN(Date.parse(to))) {
      return res.status(400).send("to date is not a valid date");
    } else if (to) {
      toDate = new Date(to);
    }
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).send("from date is not a valid date");
    } else if (from) {
      fromDate = new Date(from);
    }

    if (fromDate && toDate) {
      if (isFutureDate(fromDate) && isFutureDate(toDate)) {
        return res.status(400).send("date range should not be in the future");
      } else if (fromDate.getTime() > toDate.getTime()) {
        return res.status(400).send("from date greater than to date");
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
        return res.status(400).send("date range should not be in the future");
      }
    }
  } catch (e) {
    return res.status(400).send(e.message);
  }

  let pageOfUserServices;
  let users;
  let isWarning = false;

  if (status || from || to) {
    ({ toDate, fromDate, isWarning } = findDateRange(
      toDate,
      fromDate,
      duration,
      isWarning,
    ));

    users = await directories.getUserWithFilters(
      status,
      fromDate,
      toDate,
      req.correlationId,
    );
    if (!users) {
      const responseBody = {
        users: [],
        numberOfRecords: 0,
        page: 0,
        numberOfPages: 0,
      };
      addAddionalMessage(responseBody, fromDate, toDate, duration, isWarning);

      return res.send(responseBody);
    }
    const userIds = users.map((user) => user.sub);
    pageOfUserServices = await listServiceUsers(
      req.client.id,
      userIds,
      page,
      pageSize,
      req.correlationId,
    );

    const responseBody = prepareUserResponse(pageOfUserServices, users);

    addAddionalMessage(responseBody, fromDate, toDate, duration, isWarning);
    return res.send(responseBody);
  }
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

const addAddionalMessage = (
  responseBody,
  fromDate,
  toDate,
  duration,
  isWarning,
) => {
  if (fromDate && toDate) {
    responseBody.dateRange = `Users between ${fromDate} and ${toDate}`;
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
