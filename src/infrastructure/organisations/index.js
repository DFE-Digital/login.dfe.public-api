const config = require("./../config");

let adapter;
if (config.organisations.type === "static") {
  adapter = require("./static");
} else if (config.organisations.type === "api") {
  adapter = require("./api");
} else {
  throw new Error(
    `Invalid organisations type ${config.directories.type} in config`,
  );
}

module.exports = adapter;
