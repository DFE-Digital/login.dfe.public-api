const mockRequest = (customRequestData) => {
  const defaultRequest = {
    correlationId: 'server-correlation-id',
    clientCorrelationId: 'client-correlation-id',
  };
  return customRequestData ? Object.assign(defaultRequest, customRequestData) : defaultRequest;
};

const mockResponse = () => {
  return {
    send: jest.fn(),
    status: jest.fn(),
    contentType: jest.fn(),
    json: jest.fn(),
    mockResetAll: function () {
      this.send.mockReset().mockReturnValue(this);
      this.status.mockReset().mockReturnValue(this);
      this.contentType.mockReset().mockReturnValue(this);
      this.json.mockReset().mockReturnValue(this);
    },
  };
};

const mockConfig = (customConfig) => {
  const defaultConfig = {
    hostingEnvironment: {
      agentKeepAlive: {
        maxSockets: 160,
        maxFreeSockets: 10,
        timeout: 60000,
        keepAliveTimeout: 30000,
      },
    },
    auth: {
      type: 'secret',
      secret: 'unit-tests',
    },
    queue: {
      connectionString: 'redis-connection-string',
    },
    hotConfig: {
      type: 'static',
    },
    applications: {
      type: 'static',
    },
    access: {
      type: 'static',
    },
    organisations: {
      type: 'static',
    },
  };
  return customConfig ? Object.assign(defaultConfig, customConfig) : defaultConfig;
};

const mockLogger = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    mockResetAll: function() {
      this.info.mockReset();
      this.warn.mockReset();
      this.error.mockReset();
    },
  };
};

module.exports = {
  mockRequest,
  mockResponse,
  mockConfig,
  mockLogger,
};
