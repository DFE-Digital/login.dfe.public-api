const clients = [
  {
    client_id: 'client1',
    client_secret: 'some-secure-secret',
    redirect_uris: [
      'https://client.one/auth/cb',
      'https://client.one/register/complete',
    ],
    post_logout_redirect_uris: [
      'https://client.one/signout/complete',
    ],
  },
];

const getClientByServiceId = async (id) => {
  return Promise.resolve(clients.find(c => c.client_id.toLowerCase() === id.toLowerCase()));
};

module.exports = {
  getClientByServiceId,
};
