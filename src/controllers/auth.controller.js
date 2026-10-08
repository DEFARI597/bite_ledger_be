const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }
    
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return sendError(res, error.message, 401);
    }
    console.error('[Auth Controller Error]:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

module.exports = {
  login
};
