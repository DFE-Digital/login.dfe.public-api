const config = require("./../config");

let adapter;
if (config.directories.type.toLowerCase() === "api") {
  adapter = require("./api");
} else if (config.directories.type.toLowerCase() === "static") {
  adapter = require("./static");
} else {
  throw new Error(`Invalid applications type ${config.directories.type}`);
}

module.exports = adapter;
