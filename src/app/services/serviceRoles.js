const { extractPageParam, extractPageSizeParam } = require('../utils');
const { listServiceRoles } = require('../../infrastructure/applications');

const listServiceRoles = async (req, res) => {

  const serviceRoles = await listServiceRoles(req.params.cid, req.correlationId);
  return res.send({
    roles: serviceRoles.roles
  });
};
module.exports = listRoles;
