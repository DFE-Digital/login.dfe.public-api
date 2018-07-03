const uuid = require('uuid/v4');

const requestCorrelation = () => {
  return (req, res, next) => {
    req.correlationId = uuid();
    req.clientCorrelationId = req.get('x-correlation-id') || undefined;
    next();
  };
};

module.exports = requestCorrelation;
