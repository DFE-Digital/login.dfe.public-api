const { extractPageParam, extractPageSizeParam } = require("./../utils");
const {
  listServiceGrantTokens,
} = require("./../../infrastructure/applications");

const listTokens = async (req, res) => {
  let page;
  let pageSize;
  try {
    page = extractPageParam(req);
    pageSize = extractPageSizeParam(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  const pageOfTokens = await listServiceGrantTokens(
    req.params.sid,
    req.params.grantId,
    page,
    pageSize,
    req.correlationId,
  );
  return res.send({
    tokens: pageOfTokens.tokens,
    numberOfRecords: pageOfTokens.numberOfRecords,
    page: pageOfTokens.page,
    numberOfPages: pageOfTokens.numberOfPages,
  });
};
module.exports = listTokens;
