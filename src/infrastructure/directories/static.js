const usersByIds = async (ids) => {
  if (!ids) {
    return undefined;
  }
  return [];
};

const userById = async () => {
  return Promise.resolve();
};

module.exports = {
  userById,
  usersByIds,
};
