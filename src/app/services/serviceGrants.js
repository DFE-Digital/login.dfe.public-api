const { extractPageParam, extractPageSizeParam } = require("./../utils");
const { listServiceGrants } = require("./../../infrastructure/applications");

const listGrants = async (req, res) => {
  let page;
  let pageSize;
  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  const pageOfGrants = await listServiceGrants(
    req.params.sid,
    page,
    pageSize,
    req.correlationId,
  );
  return res.send({
    grants: pageOfGrants.grants,
    numberOfRecords: pageOfGrants.numberOfRecords,
    page: pageOfGrants.page,
    numberOfPages: pageOfGrants.numberOfPages,
  });
};
module.exports = listGrants;
