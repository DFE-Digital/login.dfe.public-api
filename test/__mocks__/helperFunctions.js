export const extractPageParam = jest.fn();
export const extractPageSizeParam = jest.fn();
export const extractStatusParam = jest.fn();
export const extractToParam = jest.fn();
export const extractFromParam = jest.fn();
export const isFutureDate = jest.fn();
export const findDateRange = jest.fn();
export const listServiceUsers = jest.fn();
export const usersByIds = jest.fn();
export const prepareUserResponse = jest.fn();
export const addAddionalMessage = jest.fn();

// Helper to reset all mocks before each test
export const resetAllMocks = () => {
  extractPageParam.mockReset();
  extractPageSizeParam.mockReset();
  extractStatusParam.mockReset();
  extractToParam.mockReset();
  extractFromParam.mockReset();
  isFutureDate.mockReset();
  findDateRange.mockReset();
  listServiceUsers.mockReset();
  usersByIds.mockReset();
  prepareUserResponse.mockReset();
  addAddionalMessage.mockReset();
};
