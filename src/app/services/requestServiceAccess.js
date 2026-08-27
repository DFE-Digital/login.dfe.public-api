const {
  getUserServiceRequestsRaw,
  getUserOrganisationsRaw,
  getUser,
} = require("login.dfe.api-client/users");
const {
  getServiceRolesRaw,
  getService,
} = require("login.dfe.api-client/services");
const { NotificationClient } = require("login.dfe.jobs-client");
const { getOrganisation } = require("login.dfe.api-client/organisations");
const { services } = require("login.dfe.dao");
const { v4: uuid } = require("uuid");
const PolicyEngine = require("login.dfe.policy-engine");
const config = require("../../infrastructure/config");
const { equalsIgnoreCase } = require("../utils");

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

// login.dfe.policy-engine pins its own login.dfe.api-client dependency,
// which lands as a separate nested copy from the one this repo uses
// directly (major version mismatch) and so has its own independent,
// unconfigured connection registry. registerApiClient makes the engine
// call setupApi() on that copy itself, using this same config.
const policyEngine = new PolicyEngine(config, { registerApiClient: true });

const createServiceRequest = async (
  reqId,
  userId,
  serviceId,
  rolesIds,
  organisationId,
  requestType,
) => {
  return await services.putUserServiceRequest({
    id: reqId,
    user_id: userId,
    service_id: serviceId,
    role_ids: rolesIds.length ? rolesIds.toString() : null,
    organisation_id: organisationId,
    status: 0,
    actioned_reason: "Pending",
    request_type: requestType,
  });
};

const validateRequest = async ({
  serviceId,
  organisationId,
  userId,
  roleIds,
  client,
}) => {
  if (
    !serviceId ||
    !organisationId ||
    !userId ||
    !Array.isArray(roleIds) ||
    roleIds.length === 0
  ) {
    return {
      valid: false,
      status: 400,
      error:
        "serviceId, organisation, userId and roleIds (a non-empty array) are required.",
    };
  }

  const user = await getUser({ by: { id: userId } });

  if (!user) {
    return {
      valid: false,
      status: 404,
      error: "User not found",
    };
  }

  if (user.status !== 1) {
    return {
      valid: false,
      status: 400,
      error: "User has to be active.",
    };
  }

  const organisation = await getOrganisation({
    by: { organisationId: organisationId },
  });

  if (!organisation) {
    return {
      valid: false,
      status: 404,
      error: "Organisation not found",
    };
  }

  const userOrganisations = await getUserOrganisationsRaw({ userId });
  const belongsToOrganisation = userOrganisations.some((userOrganisation) =>
    equalsIgnoreCase(userOrganisation.organisation?.id, organisationId),
  );

  if (!belongsToOrganisation) {
    return {
      valid: false,
      status: 400,
      error: "User does not belong to organisation.",
    };
  }

  const service = await getService({
    by: { serviceId: serviceId },
  });

  if (!service) {
    return {
      valid: false,
      status: 404,
      error: "Service not found",
    };
  }

  const policyResults = await policyEngine.getPolicyApplicationResultsForUser(
    userId,
    organisationId,
    [service.id],
  );
  const serviceAvailableToOrganisation = policyResults.some(
    (result) =>
      equalsIgnoreCase(result.id, service.id) &&
      result.serviceAvailableToUser === true,
  );

  if (!serviceAvailableToOrganisation) {
    return {
      valid: false,
      status: 400,
      error: "Service does not belong to organisation",
    };
  }

  if (
    service.relyingParty.clientId !== client.relyingParty.client_id &&
    !equalsIgnoreCase(service.parentId, client.id)
  ) {
    return {
      valid: false,
      status: 403,
      error: "Not authorized to request access for this service.",
    };
  }

  const uniqueRoleIds = roleIds.filter(
    (id, index) =>
      roleIds.findIndex((other) => equalsIgnoreCase(other, id)) === index,
  );

  const allServiceRoles = await getServiceRolesRaw({ serviceId });
  const roles = uniqueRoleIds.map((id) =>
    allServiceRoles.find((r) => equalsIgnoreCase(r?.id, id)),
  );
  const invalidRoleIds = uniqueRoleIds.filter((id, index) => !roles[index]);

  if (invalidRoleIds.length > 0) {
    return {
      valid: false,
      status: 400,
      error: `Invalid role for service: ${invalidRoleIds.join(", ")}`,
    };
  }

  return {
    valid: true,
    user,
    roles,
    organisation,
    service,
  };
};

const requestServiceAccess = async (req, res) => {
  if (!config.notifications.connectionString) {
    return res.status(500).send("Missing notification connection string");
  }

  const baseUrl = `https://${config.services.host}:${config.services.port}`;

  const { sid: serviceId } = req.params;
  const { organisation: organisationId, roleIds, userId } = req.body;
  const { client } = req;

  const validation = await validateRequest({
    serviceId,
    organisationId,
    userId,
    roleIds,
    client,
  });

  if (!validation.valid) {
    return res.status(validation.status).json({
      error: validation.error,
    });
  }

  const { user, roles, organisation, service } = validation;

  const userServiceRequests =
    (await getUserServiceRequestsRaw({ userId: req.body.userId })) || [];

  const matchingRequest = userServiceRequests.find(
    (item) =>
      equalsIgnoreCase(item.userId, req.body.userId) &&
      equalsIgnoreCase(item.organisationId, req.body.organisation) &&
      equalsIgnoreCase(item.serviceId, req.params.sid) &&
      item.status === 0,
  );

  if (matchingRequest) {
    return res.status(409).send("An existing request is already in progress");
  }

  const serviceRequestId = uuid();
  const roleIdsForUrl = roles.map((role) => role.id);

  const approveUrl = `${baseUrl}/request-service/${organisationId}/users/${userId}/services/${serviceId}/roles/${encodeURIComponent(
    JSON.stringify(roleIdsForUrl),
  )}/approve?reqId=${serviceRequestId}`;

  const rejectUrl = `${baseUrl}/request-service/${organisationId}/users/${userId}/services/${serviceId}/roles/${encodeURIComponent(
    JSON.stringify(roleIdsForUrl),
  )}/reject?reqId=${serviceRequestId}`;

  const helpUrl = `${config.help.url}/requests/can-end-user-request-service`;

  await createServiceRequest(
    serviceRequestId,
    userId,
    serviceId,
    roleIdsForUrl,
    organisationId,
    "service",
  );

  await notificationClient.sendServiceRequestToApprovers(
    user.firstName + " " + user.lastName,
    user.email,
    organisationId,
    organisation.name,
    service.name,
    roles.map((role) => role.name),
    rejectUrl,
    approveUrl,
    helpUrl,
  );

  return res.status(202).send();
};

module.exports = requestServiceAccess;
