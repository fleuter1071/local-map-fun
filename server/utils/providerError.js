function createProviderError(message, { statusCode, code, detail } = {}) {
  const error = new Error(message);
  error.name = "ProviderError";
  error.statusCode = statusCode;
  error.code = code || "provider_error";
  error.detail = detail || message;
  return error;
}

module.exports = {
  createProviderError
};
