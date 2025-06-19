const { extractPageParam, extractPageSizeParam } = require("./../utils");
const { getPaginatedServicesRaw } = require("login.dfe.api-client/services");

const listServices = async (req, res) => {
  if (
    !req.client.relyingParty.params ||
    req.client.relyingParty.params.canCreateChildApplications !== "true"
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

  const pageOfServices = await getPaginatedServicesRaw({
    pageSize: pageSize,
    pageNumber: page,
    serviceParentId: req.client.id,
  });
  return res.send({
    services: pageOfServices.services.map((s) => ({
      name: s.name,
      description: s.description,
      clientId: s.relyingParty.client_id,
      redirectUris: s.relyingParty.redirect_uris,
    })),
    numberOfRecords: pageOfServices.numberOfRecords,
    page: pageOfServices.page,
    numberOfPages: pageOfServices.numberOfPages,
  });
};
module.exports = listServices;
