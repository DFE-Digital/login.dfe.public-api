const logger = require("../../infrastructure/logger");
const {
  listServiceUsers,
  getServiceById,
  getOrganisationCategories,
  getOrganisationStatuses,
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

    // Get the details for the user (name, email, etc)
    const userDetails = await usersByIds(uid, correlationId);
    if (!userDetails) {
      return res.status(404).send();
    }

    // Call to get data about user of this service (limited by clientId). Returns their organisation role for this
    // service (end user/approver), and the organisations this user is part of for this service
    // (can be part of a service for multiple organisations)
    const pageOfUserServices = await listServiceUsers(
      req.client.id,
      [uid],
      1,
      200,
      req.correlationId,
    );

    let response = {
      userId: userDetails[0].id,
      userStatus: userDetails[0].status,
      email: userDetails[0].email,
      familyName: userDetails[0].family_name,
      givenName: userDetails[0].given_name,
    };

    // Need to do 2 calls so we can translate the organisation category and status
    // ids into their human readable names
    const organisationCategoryData = await getOrganisationCategories(
      uid,
      correlationId,
    );
    const organisationStatusData = await getOrganisationStatuses(
      uid,
      correlationId,
    );

    const mappedOrgs = pageOfUserServices.users.map((x) => {
      const category = organisationCategoryData.find(
        (category) => category.id === x.organisation.Category,
      );
      const status = organisationStatusData.find(
        (status) => status.id === x.organisation.Status,
      );
      return {
        id: x.organisation.id,
        name: x.organisation.name,
        category: {
          id: x.organisation.Category,
          name: category.name,
        },
        urn: x.organisation.URN,
        uid: x.organisation.UID,
        ukprn: x.organisation.UKPRN,
        establishmentNumber: x.organisation.EstablishmentNumber,
        status: {
          id: x.organisation.Status,
          name: status.name,
        },
        closedOn: x.organisation.ClosedOn,
        address: x.organisation.Address,
        telephone: x.organisation.telephone,
        statutoryLowAge: x.organisation.statutoryLowAge,
        statutoryHighAge: x.organisation.statutoryHighAge,
        legacyId: x.organisation.legacyId,
        companyRegistrationNumber: x.organisation.companyRegistrationNumber,
        ProviderProfileID: x.organisation.ProviderProfileID,
        UPIN: x.organisation.UPIN,
        PIMSProviderType: x.organisation.PIMSProviderType,
        PIMSStatus: x.organisation.PIMSStatus,
        DistrictAdministrativeName: x.organisation.DistrictAdministrativeName,
        OpenedOn: x.organisation.OpenedOn,
        SourceSystem: x.organisation.SourceSystem,
        ProviderTypeName: x.organisation.ProviderTypeName,
        GIASProviderType: x.organisation.GIASProviderType,
        PIMSProviderTypeCode: x.organisation.PIMSProviderTypeCode,
      };
    });
    response.organisations = mappedOrgs;

    // Get list of ALL services for the user.  We need this because it has all the the service specific roles
    // for the user against each service for each organisationId.
    // We need this because that role information isn't provided in the listServiceUsers call.
    const servicesForAUser = await getServicesForUser(uid, correlationId);

    // A user can have multiple organisations for the same service, so we loop over them all.
    for (const organisation of response.organisations) {
      organisation.orgRoleId = pageOfUserServices.users[0].role.id;
      organisation.orgRoleName = pageOfUserServices.users[0].role.name;

      const orgServiceData = servicesForAUser.find(
        (service) => service.organisationId === organisation.id,
      );

      // Resolve all the serviceIds and roleIds into names for the response
      const serviceDetails = await getServiceById(orgServiceData.serviceId);
      const roleDataForService = await getRoles(orgServiceData.serviceId);

      const tidiedServiceDetails = {
        name: serviceDetails.name,
        description: serviceDetails.description,
        roles: [],
      };

      // For all the roles in the service, loop over them so we have a list of names instead
      // of a list of just ids.
      const roles = [];
      for (const role of orgServiceData.roles) {
        const roleData = roleDataForService.find((r) => r.id === role.id);
        if (roleData) {
          const tidiedRoleData = {
            name: roleData.name,
            code: roleData.code,
          };
          roles.push(tidiedRoleData);
        }
      }
      tidiedServiceDetails.roles = roles;
      organisation.services = tidiedServiceDetails;
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
