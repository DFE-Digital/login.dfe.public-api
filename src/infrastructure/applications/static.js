const destroyService = async () => {
  return Promise.resolve();
};

const updateService = async () => {
  return Promise.resolve();
};

const listServices = async (parentId, page) => {
  return Promise.resolve({
    services: [],
    numberOfRecords: 0,
    page,
    numberOfPages: 0,
  });
};

module.exports = {
  destroyService,
  updateService,
  listServices,
};
