const { extractPageParam, extractPageSizeParam } = require('../utils');
const { listOrganisationUsersV2 } = require('../../infrastructure/organisations');
const { usersByIds } = require('../../infrastructure/directories');
const { getPoliciesOfService } = require('../../infrastructure/access');

const listApprovers = async (req, res) => {
  let page;
  let pageSize;
  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  let filterTypes = [];
  let filterStates = [];
  const policiesForService = await getPoliciesOfService(req.client.id, req.correlationId);
  if (policiesForService && policiesForService.length > 0) {
    for (let i = 0; i < policiesForService.length; i++) {
      const policy = policiesForService[i];
      if (policy.conditions && policy.conditions.length > 0) {
        for (let c = 0; c < policy.conditions.length; c++) {
          const condition = policy.conditions[c];
          if (condition.field === 'organisation.type.id') {
            filterTypes.push(...condition.value);
          }
          if (condition.field === 'organisation.status.id') {
            filterStates.push(...condition.value);
          }
        }
      }
    }
  }
  const pageOfApprovers = await listOrganisationUsersV2(page, pageSize, 10000, filterTypes, filterStates, req.correlationId);
  const userIds = pageOfApprovers.users.map((user) => user.userId);
  const releventUsers = await usersByIds(userIds.join(','), req.correlationId);
  const mappedRecords = pageOfApprovers.users.map((userOrg) => {
    const user = releventUsers.find((u)=> u.sub === userOrg.userId);
    let mappedUserOrg = {
      organisation: userOrg.organisation,
      roleId: userOrg.role && userOrg.role.id ? userOrg.role.id : undefined,
      roleName: userOrg.role && userOrg.role.name ? userOrg.role.name : undefined,
      userId: userOrg.userId
    };
    if (user) {
      mappedUserOrg = Object.assign({
        ...mappedUserOrg,
      }, {email: user.email, familyName: user.family_name, givenName: user.given_name});
    }
    return mappedUserOrg;
  });

  return res.send({
    users: mappedRecords,
    numberOfRecords: pageOfApprovers.totalNumberOfRecords,
    page: pageOfApprovers.page,
    numberOfPages: pageOfApprovers.totalNumberOfPages,
  });
};
module.exports = listApprovers;
