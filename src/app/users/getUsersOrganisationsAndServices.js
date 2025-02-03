const logger = require("../../infrastructure/logger");
const {
  listServiceUsers,
  getServiceById,
} = require("../../infrastructure/organisations");
const { usersByIds } = require("../../infrastructure/directories");
const { getServicesForUser, getRoles } = require("../../infrastructure/access");

const getUsersOrganisationsAndServices = async (req, res) => {
  const uid = req.params.id;
  const { correlationId, clientCorrelationId } = req;
  try {
    logger.info(
      `Getting organisations for user ${uid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    const userDetails = await usersByIds(uid, correlationId);
    if (!userDetails) {
      return res.status(404).send();
    }
    console.log(userDetails);

    // Call to get services for user
    const pageOfUserServices = await listServiceUsers(
      req.client.id,
      [uid],
      1,
      200,
      req.correlationId,
    );
    console.log("---------- page of user services");
    console.log(pageOfUserServices);
    console.log(pageOfUserServices.users[0]);

    const servicesForAUser = await getServicesForUser(uid, correlationId);
    console.log("---------- get services for user");
    console.log(servicesForAUser);

    // Shape data to expected
    let response = userDetails[0];
    const mappedOrgs = pageOfUserServices.users.map((x) => x.organisation);
    //console.log("mapped orgs");
    //console.log(mappedOrgs);
    response["organisations"] = mappedOrgs;

    // For each organisation, list the services that user has for that organisation
    //response.organisations.forEach(async (organisation) => {

    for (const organisation of response.organisations) {
      const orgServiceData = servicesForAUser.find(
        (service) => service.organisationId === organisation.id,
      );

      // get service name via organisations getServiceById
      const serviceDetails = await getServiceById(orgServiceData.serviceId);
      console.log("service details --------");
      console.log(serviceDetails);

      // get role names from access listRolesOfService
      // For each role, shape data
      //console.log("role details----");
      const roleDataForService = await getRoles(orgServiceData.serviceId);
      ///console.log(roleDataForService);

      const roles = [];
      for (const role of orgServiceData.roles) {
        console.log(role);
        const roleData = roleDataForService.find((r) => r.id === role.id);
        if (roleData) {
          roles.push(roleData);
        }
      }
      serviceDetails.roles = roles;

      // const firstRole = orgServiceData.roles[0];
      // const resolvedFirstRole = roleDataForService.find((role) => role.id === firstRole.id)
      // serviceDetails.roles = [resolvedFirstRole];
      organisation["services"] = serviceDetails;

      console.log(organisation);

      //orgServiceData.roles = [firstRole];
      // console.log(orgServiceData);
      // if (orgServiceData) {
      //   organisation["services"] = orgServiceData;
      // }
    }
    return res.send(response);
  } catch (e) {
    logger.info(
      `Error getting organisations for user ${uid} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

module.exports = getUsersOrganisationsAndServices;
