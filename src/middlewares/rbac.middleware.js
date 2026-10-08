const { sendError } = require('../utils/response.util');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'User role is not defined in token', 403);
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to access this resource', 403);
    }
    
    next();
  };
};

module.exports = {
  authorizeRoles
};
