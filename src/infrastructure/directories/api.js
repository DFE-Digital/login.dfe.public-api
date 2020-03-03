const config = require('./../config');
const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const usersByIds = async (ids) => {
  if (!ids) {
    return undefined;
  }
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const users = await rp({
      method: 'POST',
      uri: `${config.directories.service.url}/users/by-ids`,
      body: { ids },
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
    return users;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  usersByIds,
};
