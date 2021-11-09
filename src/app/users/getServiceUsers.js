const { extractPageParam, extractPageSizeParam, extractStatusParam, extractFromParam, extractToParam } = require('../utils');
const { listServiceUsers } = require('../../infrastructure/organisations');
const { usersByIds } = require('../../infrastructure/directories');
const { directories } = require('login.dfe.dao');

const listUsers = async (req, res) => {
  let page;
  let pageSize;
  let status;
  let to;
  let from;
  let fromDate;
  let toDate;
  const dataSpan = 7;


  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
    status = extractStatusParam(req);
    to = extractToParam(req);
    from = extractFromParam(req);

    if (status && status !== '0') {
      return res.status(400).send('status should only be 0');
    }


    if (to && isNaN(Date.parse(to))) {
      return res.status(400).send('to date is not a valid date');
    } else if (to) {
      toDate = new Date(to);
    }
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).send('from date is not a valid date');
    } else if (from) {
      fromDate = new Date(from);
    }

    if (fromDate && toDate) {
      const time_difference = toDate.getTime() - fromDate.getTime();
      const days_difference = Math.abs(time_difference) / (1000 * 60 * 60 * 24);
      if (days_difference > dataSpan) {
        return res.status(400).send(`Only ${dataSpan} days are allowed between dates`);
      }
    }

  } catch (e) {
    return res.status(400).send(e.message);
  }


  let pageOfUserServices;
  let users;
  let isWarning = false;

  if (status || from || to) {

    if (toDate && !fromDate) {
      fromDate = new Date(toDate);
      fromDate.setDate(toDate.getDay() - dataSpan);
      isWarning = true;
    }
    else if (!toDate && fromDate) {
      toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDay() + dataSpan);
      isWarning = true;
    } else if (!toDate && !fromDate) {
      toDate = new Date();
      fromDate = new Date(new Date().setDate(new Date().getDay() - dataSpan));
      isWarning = true;
    }

    users = await directories.getUserWithFilters(status, fromDate, toDate, req.correlationId);
    if (!users) {
      return res.send({
        users: [],
        numberOfRecords: 0,
        page: 0,
        numberOfPages: 0
      });
    }
    const userIds = users.map((user) => user.sub);
    pageOfUserServices = await listServiceUsers(req.client.id, userIds, page, pageSize, req.correlationId);

  } else {
    pageOfUserServices = await listServiceUsers(req.client.id, null, page, pageSize, req.correlationId);
    const userIds = pageOfUserServices.users.map((user) => user.id);
    users = await usersByIds(userIds.join(','), req.correlationId);
  }

  const mappedRecords = pageOfUserServices.users.map((userService) => {
    const user = users.find((u) => u.sub === userService.id);
    let mappedUserService = {
      approvedAt: userService.createdAt,
      updatedAt: userService.updatedAt,
      organisation: userService.organisation,
      roleName: userService.role && userService.role.name ? userService.role.name : undefined,
      roleId: userService.role && userService.role.id ? userService.role.id : undefined,
      userId: userService.id
    };
    if (user) {
      mappedUserService = Object.assign({
        ...mappedUserService,
      }, { email: user.email, familyName: user.family_name, givenName: user.given_name });
    }
    return mappedUserService;
  });
  const responseBody = {
    users: mappedRecords,
    numberOfRecords: pageOfUserServices.totalNumberOfRecords,
    page: pageOfUserServices.page,
    numberOfPages: pageOfUserServices.totalNumberOfPages
  }

  if (isWarning) {
    responseBody.warning = `Only ${dataSpan} days of data can be fetched`
  }

  return res.send(responseBody);


};

module.exports = listUsers;
