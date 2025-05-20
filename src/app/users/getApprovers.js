const { extractPageParam, extractPageSizeParam } = require("../utils");
const {
  listOrganisationUsersV3,
} = require("../../infrastructure/organisations");
const { getUsersRaw } = require("login.dfe.api-client/users");
const { getPoliciesOfService } = require("../../infrastructure/access");

const listApprovers = async (req, res) => {
  if (
    !req.client.relyingParty ||
    !req.client.relyingParty.params ||
    req.client.relyingParty.params.canViewApproverReport !== "true"
  ) {
    return res.status(403).send();
  }

  let page;
  let pageSize;
  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  const policiesForService = await getPoliciesOfService(
    req.client.id,
    req.correlationId,
  );
  const pageOfApprovers = await listOrganisationUsersV3(
    page,
    pageSize,
    10000,
    policiesForService,
    req.correlationId,
  );
  const userIds = pageOfApprovers.users.map((user) => user.userId);
  const releventUsers = await getUsersRaw({ by: { userIds: userIds } });
  const mappedRecords = pageOfApprovers.users.map((userOrg) => {
    const user = releventUsers.find((u) => u.sub === userOrg.userId);
    let mappedUserOrg = {
      organisation: userOrg.organisation,
      roleId: userOrg.role && userOrg.role.id ? userOrg.role.id : undefined,
      roleName:
        userOrg.role && userOrg.role.name ? userOrg.role.name : undefined,
      userId: userOrg.userId,
    };
    if (user) {
      mappedUserOrg = Object.assign(
        {
          ...mappedUserOrg,
        },
        {
          email: user.email,
          familyName: user.family_name,
          givenName: user.given_name,
          userStatus: user.status,
        },
      );
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
