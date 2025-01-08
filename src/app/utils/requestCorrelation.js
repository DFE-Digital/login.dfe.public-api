const uuid = require("uuid");

const requestCorrelation = () => {
  return (req, res, next) => {
    req.correlationId = uuid.v4();
    req.clientCorrelationId = req.get("x-correlation-id") || undefined;
    next();
  };
};

module.exports = requestCorrelation;
