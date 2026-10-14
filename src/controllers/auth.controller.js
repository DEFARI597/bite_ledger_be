const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const result = await authService.login(email, password);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000
    };
    res.cookie('token', result.access_token, cookieOptions);

    return sendSuccess(res, { user: result.user }, 'Login successful', 200);
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return sendError(res, error.message, 401);
    }
    console.error('[Auth Controller Error]:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    };
    res.clearCookie('token', cookieOptions);
    return sendSuccess(res, null, 'Logout successful', 200);
  } catch (error) {
    console.error('[Auth Controller Error]:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await authService.getMe(userId);
    return sendSuccess(res, user, "User profile retrieved successfully", 200);
  } catch (error) {
    if (error.message === "User not found") {
      return sendError(res, error.message, 404);
    }
    console.error("[Auth Controller Error]:", error);
    return sendError(res, "Internal server error", 500);
  }
};

module.exports = {
  getMe,
  login,
  logout
};
