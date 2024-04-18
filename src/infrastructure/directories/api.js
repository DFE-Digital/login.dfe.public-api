const config = require('./../config');
const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const usersByIds = async (ids) => {
  if (!ids) {
    return undefined;
  }
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const users = await fetchApi(`${config.directories.service.url}/users/by-ids`, {
      method: 'POST',
      body: { ids },
      headers: {
        authorization: `bearer ${token}`,
      },
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
