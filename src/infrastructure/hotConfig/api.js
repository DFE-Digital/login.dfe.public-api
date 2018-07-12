const list = async () => {
  return Promise.resolve([]);
};

const getClientByServiceId = async (serviceId) => {
  const all = await list();
  return all.filter(x => x.params && x.params.serviceId && x.params.serviceId.toLowerCase() === serviceId.toLowerCase());
};

module.exports = {
  list,
  getClientByServiceId,
};
