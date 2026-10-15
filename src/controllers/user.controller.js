const userService = require('../services/user.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getUsers = async (req, res) => {
  try {
    const { page, limit, search, roleId } = req.query;
    const result = await userService.getUsers({ page, limit, search, roleId });
    return sendSuccess(res, result, 'Users retrieved successfully', 200);
  } catch (error) {
    console.error('[User Controller Error - getUsers]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await userService.getRoles();
    return sendSuccess(res, roles, 'Roles retrieved successfully', 200);
  } catch (error) {
    console.error('[User Controller Error - getRoles]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return sendSuccess(res, user, 'User retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'User not found') {
      return sendError(res, error.message, 404);
    }
    console.error('[User Controller Error - getUserById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;
    const user = await userService.createUser({ name, email, password, roleId });
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    if (
      error.message === 'Name, email, password, and roleId are required' ||
      error.message === 'Role not found'
    ) {
      return sendError(res, error.message, 400);
    }
    if (error.message === 'Email already registered') {
      return sendError(res, error.message, 409);
    }
    console.error('[User Controller Error - createUser]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, roleId } = req.body;
    const user = await userService.updateUser(id, { name, email, password, roleId });
    return sendSuccess(res, user, 'User updated successfully', 200);
  } catch (error) {
    if (error.message === 'User not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Email already in use') {
      return sendError(res, error.message, 409);
    }
    if (error.message === 'Role not found') {
      return sendError(res, error.message, 400);
    }
    console.error('[User Controller Error - updateUser]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.sub;
    const result = await userService.deleteUser(id, currentUserId);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'User not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Cannot delete your own account') {
      return sendError(res, error.message, 400);
    }
    console.error('[User Controller Error - deleteUser]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getUsers,
  getRoles,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
