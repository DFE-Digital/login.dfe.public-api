const config = require('./../config');

let adapter;
if (config.access.type.toLowerCase() === 'api') {
  adapter = require('./api');
} else if (config.access.type.toLowerCase() === 'static') {
  adapter = require('./static');
} else {
  throw new Error(`Invalid access type ${config.access.type}`);
}

module.exports = adapter;
