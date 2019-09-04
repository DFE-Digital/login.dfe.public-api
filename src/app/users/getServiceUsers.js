const { extractPageParam, extractPageSizeParam } = require('../utils');
const { listServiceUsers } = require('../../infrastructure/organisations');
const { usersByIds } = require('../../infrastructure/directories');

const listUsers = async (req, res) => {
  let page;
  let pageSize;
  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  const pageOfUserServices = await listServiceUsers(req.client.id, page, pageSize, req.correlationId);
  const userIds = pageOfUserServices.users.map((user) => user.id);
  const releventUsers = await usersByIds(userIds.join(','), req.correlationId);
  const mappedRecords = pageOfUserServices.users.map((userService) => {
    const user = releventUsers.find((u)=> u.sub === userService.id);
    let mappedUserService = {
      approvedAt : userService.createdAt,
      updatedAt: userService.updatedAt,
      organisation: userService.organisation,
      roleName: userService.role && userService.role.name ? userService.role.name : undefined,
      roleId: userService.role && userService.role.id ? userService.role.id : undefined,
      userId: userService.id
    };
    if (user) {
      mappedUserService = Object.assign({
        ...mappedUserService,
      }, {email: user.email, familyName: user.family_name, givenName: user.given_name});
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
