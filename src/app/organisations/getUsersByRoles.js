const logger = require('./../../infrastructure/logger');
const {getOrganisationByTypeAndIdentifier} = require("../../infrastructure/organisations");
const { getServiceUsers } = require("../../infrastructure/access");
const { usersByIds } = require('../../infrastructure/directories');

const getUsersByRoles = async (req, res) => {
    const { correlationId, clientCorrelationId } = req;
    const { roles } = req.query;
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
    let usersDetails;
    if(serviceUsers && serviceUsers.services){
        const userIds = serviceUsers.services.filter(f=>f.roles.find(role => roles.includes(role.code))).map(user=>user.userId);
        // Get user details by user ids
        if(userIds) {
            usersDetails = await usersByIds(userIds.join(','), req.correlationId);
        }
    }else{
        return res.status(404).send();
    }

    if(usersDetails) {
        const users = usersDetails.map((user)=>{
            return {email:user.email,firstName: user.given_name, lastName: user.family_name, roles};
        });
        return res.json(
            {ukprn:req.params.id, users}
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
module.exports=getUsersByRoles;
