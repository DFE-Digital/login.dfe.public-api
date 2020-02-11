const logger = require('./../../infrastructure/logger');
const {getOrganisationByTypeAndIdentifier} = require('../../infrastructure/organisations');
const { getServiceUsers, getRoles, getServiceUsersV2 } = require('../../infrastructure/access');
const { usersByIds } = require('../../infrastructure/directories');

const getUserOverview = async (req, res) => {
    const { correlationId, clientCorrelationId } = req;
    const { roles, page, pageSize } = req.query;
    const ukprn = req.params.id;
    try {
        logger.info(`Getting users for UKPRN ${req.params.id} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`, {
            correlationId,
            clientCorrelationId
        });
    if (!req.client.id || !req.params.id) {
        return res.status(400).send();
    }
    // Get organisation_id by UKPRN
    const organisation = await getOrganisationByTypeAndIdentifier('UKPRN', ukprn, correlationId);
    if (!organisation) {
        return res.status(404).send();
    }
    // Get Roles by RoleCode
    let serviceUsers = null;
    if(roles) {
        const allRoles = await getRoles(req.client.id, correlationId);
        const serviceRoleIds = allRoles.filter((role)=> {
           const r = roles.split(',').filter(r=> r.toLocaleLowerCase()===role.code.toLocaleLowerCase());
           if(r && r.length > 0) {return true;}else{return false;}
        }).map(m=>m.id);
        if(serviceRoleIds && serviceRoleIds.length > 0) {
            serviceUsers = await getServiceUsersV2(req.client.id, organisation.id, serviceRoleIds, page, pageSize, correlationId);
        }
    }else{
        serviceUsers = await getServiceUsers(req.client.id,organisation.id,correlationId);
    }
    if(serviceUsers)
    {
        const userIds = serviceUsers.services.map(ids=>ids.userId);
        const result = await getUserDetails(req,userIds.join(','));
        return res.json(
            {page: serviceUsers.page, totalPages: serviceUsers.totalNumberOfPages, totalRecords: serviceUsers.totalNumberOfRecords , result}
        );
    }else{
        return res.status(404).send();
    }
    } catch (e) {
        logger.info(`Error getting users for UKPRN ${req.params.id} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`, {
            correlationId,
            clientCorrelationId,
            stack: e.stack,
        });
        throw e;
    }
};

const getUserDetails = async (req,userIds) =>
{
    const usersDetails = await usersByIds(userIds, req.correlationId);
    return  usersDetails.map((user)=>{
        return {emails:[user.email],'name.givenname': [user.given_name], 'name.familyname': [user.family_name], Title:[''] };
    });
};

module.exports=getUserOverview;
