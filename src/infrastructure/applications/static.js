const clients = [
  {
    client_id: "client1",
    client_secret: "some-secure-secret",
    redirect_uris: [
      "https://client.one/auth/cb",
      "https://client.one/register/complete",
    ],
    post_logout_redirect_uris: ["https://client.one/signout/complete"],
  },
];

const getClientByServiceId = async (id) => {
  return Promise.resolve(
    clients.find((c) => c.client_id.toLowerCase() === id.toLowerCase()),
  );
};

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
  getClientByServiceId,
  destroyService,
  updateService,
  listServices,
};
