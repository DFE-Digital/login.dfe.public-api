const list = async () => {
  return [
    {
      friendlyName: 'DfE Sign-in',
      client_id: 'test',
      client_secret: 'test',
      redirect_uris: [
        'https://localhost:41011/auth/cb'
      ],
      post_logout_redirect_uris: [
        'https://localhost:41011/signout/complete',
      ],
      params: {
        serviceId: 'da03ea7a-6c5b-4864-be53-2eaccf63bec4'
      }
    }
  ];
};

const getClientByServiceId = async (serviceId) => {
  const all = await list();
  return all.find(x => x.params && x.params.serviceId && x.params.serviceId.toLowerCase() === serviceId.toLowerCase());
};

module.exports = {
  list,
  getClientByServiceId,
};
