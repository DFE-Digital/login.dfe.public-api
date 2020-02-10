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
    if(roles) {
        const allRoles = await getRoles(req.client.id, correlationId);
        const serviceRoleIds = allRoles.filter(role=> roles.includes(role.code)).map(m=>m.id);
        const serviceUsers = await getServiceUsersV2(req.client.id,organisation.id, serviceRoleIds, page, pageSize, correlationId);
        const result = serviceUsers.services.map((user) => {
            return {id: user.userId, roles: user.roles}
        });
        return res.json(
            {ukprn:req.params.id, result}
        );

    }else{
        const serviceUsers = await getServiceUsers(req.client.id,organisation.id,correlationId);
        return serviceUsers.services.map((user) => {
            return {id: user.userId, roles: user.roles.map(role => role.code)}
        });
    }

    // Get all users associated with that service
    const serviceUsers = await getServiceUsers(req.client.id,organisation.id,correlationId);
    let userIdNRoles, usersDetails;
    if(serviceUsers && serviceUsers.services){
        if(roles) {

            userIdNRoles = serviceUsers.services.filter(f => f.roles.find(role => roles.includes(role.code))).map((user) => {
                return {id: user.userId, roles: user.roles.map(role => role.code)}
            });
        }else{
            userIdNRoles = serviceUsers.services.map((user) => {
                return {id: user.userId, roles: user.roles.map(role => role.code)}
            });
        }
        // Get user details by user ids
        if(userIdNRoles && userIdNRoles.length) {
            const userIds = userIdNRoles.map(ids=>ids.id);
            usersDetails = await usersByIds(userIds.join(','), req.correlationId);
            const result = usersDetails.map((user)=>{
                const role = userIdNRoles.find((ids)=>ids.id===user.sub);
                return {emails:[user.email],'name.givenname': [user.given_name], 'name.familyname': [user.family_name], Title:[''] };
            });
            return res.json(
                {ukprn:req.params.id, result}
            );
        }else{
            return res.status(404).send();
        }
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
module.exports=getUserOverview;
