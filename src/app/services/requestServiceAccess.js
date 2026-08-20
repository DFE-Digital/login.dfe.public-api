const {
  getUserServiceRequestsRaw,
  getUser,
} = require("login.dfe.api-client/users");
const {
  getServiceDetailsByOrganisatonId,
  getServiceRolesRaw,
  getService,
} = require("login.dfe.api-client/services");
const { NotificationClient } = require("login.dfe.jobs-client");
const { getOrganisation } = require("login.dfe.api-client/organisations");
const { services } = require("login.dfe.dao");
const { v4: uuid } = require("uuid");
const config = require("../../infrastructure/config");

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

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
  roleId,
}) => {
  if (!serviceId || !organisationId || !userId || !roleId) {
    return {
      valid: false,
      status: 400,
      error: "serviceId, organisation, userId and roleId are required.",
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
      error: "User has to be an active.",
    };
  }

  const serviceByOrganisation = await getServiceDetailsByOrganisatonId({
    serviceId: serviceId,
    organisationId: organisationId,
  });

  if (!serviceByOrganisation) {
    return {
      valid: false,
      status: 400,
      error: "Service does not belong to organisation",
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

  const roles = await getServiceRolesRaw({ serviceId });
  const role = roles.find((r) => r?.id === roleId);

  if (!role) {
    return {
      valid: false,
      status: 400,
      error: "Invalid role for service.",
    };
  }

  return {
    valid: true,
    user,
    role,
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
  const { organisation: organisationId, roleId, userId } = req.body;

  const validation = await validateRequest({
    serviceId,
    organisationId,
    userId,
    roleId,
  });

  if (!validation.valid) {
    return res.status(validation.status).json({
      error: validation.error,
    });
  }

  const { user, role, organisation, service } = validation;

  var userServiceRequests = await getUserServiceRequestsRaw({
    userId: req.body.userId,
  });

  const matchingRequest = userServiceRequests.find(
    (item) =>
      item.userId === req.body.userId &&
      item.organisationId === req.body.organisation &&
      item.serviceId === req.params.sid, //?? Maybe add role too && state of request must be declined
  );

  if (matchingRequest) {
    return res.status(409).send("An existing request is already in progress");
  }

  const serviceRequestId = uuid();

  const approveUrl = `${baseUrl}/request-service/${organisationId}/users/${userId}/services/${serviceId}/roles/${encodeURIComponent(
    JSON.stringify(role.id),
  )}/approve?reqId=${serviceRequestId}`;

  const rejectUrl = `${baseUrl}/request-service/${organisationId}/users/${userId}/services/${serviceId}/roles/${encodeURIComponent(
    JSON.stringify(role.id),
  )}/reject?reqId=${serviceRequestId}`;

  const helpUrl = `${config.help.url}/requests/can-end-user-request-service`;

  await createServiceRequest(
    serviceRequestId,
    userId,
    serviceId,
    role.id,
    organisationId,
    "service",
  );

  await notificationClient.sendServiceRequestToApprovers(
    user.firstName + " " + user.lastName,
    user.email,
    organisationId,
    organisation.name,
    service.name,
    [role.name],
    rejectUrl,
    approveUrl,
    helpUrl,
  );

  return res.status(202);
};

module.exports = requestServiceAccess;
