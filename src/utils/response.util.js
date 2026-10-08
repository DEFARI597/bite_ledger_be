const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};
