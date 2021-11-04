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

  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
    status = extractStatusParam(req);
    to = extractToParam(req);
    from = extractFromParam(req);

    if (status && status !== '1' && status !== '0') {
      return res.status(400).send('status should be either 0 or 1');
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

  } catch (e) {
    return res.status(400).send(e.message);
  }

  let pageOfUserServices;
  let users;
  if (status || from || to) {
    users = await directories.getUserWithFilters(status, fromDate, toDate, req.correlationId);
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
  return res.send({
    users: mappedRecords,
    numberOfRecords: pageOfUserServices.totalNumberOfRecords,
    page: pageOfUserServices.page,
    numberOfPages: pageOfUserServices.totalNumberOfPages,
  });


};

module.exports = listUsers;
