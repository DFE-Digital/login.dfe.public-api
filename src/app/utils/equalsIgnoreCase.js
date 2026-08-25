const equalsIgnoreCase = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.toLowerCase() === b.toLowerCase();

module.exports = equalsIgnoreCase;
