const extractParam = (req, name, defaultValue = undefined) => {
  const key = Object.keys(req.query).find(
    (x) => x.toLowerCase() === name.toLowerCase(),
  );
  return key ? req.query[key] : defaultValue;
};
const extractIntParam = (req, name, defaultValue = 0) => {
  const value = extractParam(req, name, defaultValue);
  if (!value) {
    return defaultValue;
  }

  const int = parseInt(value.toString());
  if (isNaN(int)) {
    const err = new Error(
      `${value} is not a valid value for ${name}. Expected a number`,
    );
    err.code = "INVALID_INPUT";
    throw err;
  }
  return int;
};
const extractPageParam = (req) => {
  return extractIntParam(req, "page", 1);
};
const extractPageSizeParam = (req) => {
  return extractIntParam(req, "pageSize", 25);
};
const extractStatusParam = (req) => {
  return extractParam(req, "status");
};
const extractFromParam = (req) => {
  return extractParam(req, "from");
};
const extractToParam = (req) => {
  return extractParam(req, "to");
};

module.exports = {
  extractPageParam,
  extractPageSizeParam,
  extractIntParam,
  extractParam,
  extractStatusParam,
  extractFromParam,
  extractToParam,
};
