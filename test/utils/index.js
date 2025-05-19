const mockRequest = (customRequestData) => {
  const defaultRequest = {
    correlationId: "server-correlation-id",
    clientCorrelationId: "client-correlation-id",
    query: {},
    params: {},
  };
  return customRequestData
    ? Object.assign(defaultRequest, customRequestData)
    : defaultRequest;
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
    hostingEnvironment: {},
    auth: {
      type: "secret",
      secret: "unit-tests",
    },
    queue: {
      connectionString: "redis-connection-string",
    },
    applications: {
      type: "static",
      service: {
        url: "fake-applications-url",
      },
    },
    access: {
      type: "static",
      service: {
        url: "fake-access-url",
      },
    },
    organisations: {
      type: "static",
      service: {
        url: "fake-organisations-url",
      },
    },
    directories: {
      type: "static",
      service: {
        url: "fake-organisations-url",
        auth: {
          tenant: "fakeTenant",
        },
      },
    },
  };
  return customConfig
    ? Object.assign(defaultConfig, customConfig)
    : defaultConfig;
};

const mockLogger = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    mockResetAll: function () {
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
