const logger = require('./../../infrastructure/logger');
const {getOrganisationByTypeAndIdentifier} = require("../../infrastructure/organisations");
const { getServiceUsers } = require("../../infrastructure/access");
const { usersByIds } = require('../../infrastructure/directories');

const getUsersByRoles = async (req, res) => {
    const { correlationId, clientCorrelationId } = req;
    const roles = req.query.roles?JSON.parse(req.query.roles):null;

    try {
        logger.info(`Getting users for UKPRN ${req.params.id} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`, {
            correlationId,
            clientCorrelationId
        });
    if (!req.client.id || !req.params.id || !roles) {
        return res.status(400).send();
    }
    // Get organisation_id by UKPRN
    const organisation = await getOrganisationByTypeAndIdentifier('UKPRN', req.params.id, correlationId);
    if (!organisation) {
        return res.status(404).send();
    }
    // Get all users associated with that service
    const serviceUsers = await getServiceUsers(req.client.id,organisation.id,correlationId);
    let userIdNRoles, usersDetails;
    if(serviceUsers && serviceUsers.services){
        userIdNRoles = serviceUsers.services.filter(f=>f.roles.find(role => roles.includes(role.code))).
        map((user)=> {return {id: user.userId,roles: user.roles.map(role=>role.code)}});
        // Get user details by user ids
        if(userIdNRoles && userIdNRoles.length) {
            const userIds = userIdNRoles.map(ids=>ids.id);
            usersDetails = await usersByIds(userIds.join(','), req.correlationId);
            const users = usersDetails.map((user)=>{
                const role = userIdNRoles.find((ids)=>ids.id===user.sub);
                return {email:user.email,firstName: user.given_name, lastName: user.family_name, roles: role? role.roles: null };
            });
            return res.json(
                {ukprn:req.params.id, users}
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
module.exports=getUsersByRoles;
