const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/hash.util');

const formatUserResponse = (user) => {
  if (!user) return null;
  const roleName = user.role ? user.role.name : null;
  const roleDescription = user.role ? user.role.description : null;
  const permissions = user.role && user.role.permissions
    ? user.role.permissions.map((p) => (p.permission ? p.permission.name : p.name))
    : [];

  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    roleId: user.roleId ? user.roleId.toString() : null,
    role: roleName,
    roleDescription,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const getUsers = async ({ page = 1, limit = 10, search = '', roleId }) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (currentPage - 1) * take;

  const where = {
    deletedAt: null,
  };

  if (search && search.trim() !== '') {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  if (roleId) {
    try {
      where.roleId = BigInt(roleId);
    } catch {
      // ignore invalid bigint
    }
  }

  const [users, total] = await Promise.all([
    userRepository.findUsers(where, skip, take),
    userRepository.countUsers(where),
  ]);

  const sanitizedUsers = users.map(formatUserResponse);
  const totalPages = Math.ceil(total / take) || 1;

  return {
    users: sanitizedUsers,
    pagination: {
      total,
      page: currentPage,
      limit: take,
      totalPages,
    },
  };
};

const getUserById = async (id) => {
  const user = await userRepository.findUserById(BigInt(id));
  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }
  return formatUserResponse(user);
};

const createUser = async ({ name, email, password, roleId }) => {
  if (!name || !email || !password || !roleId) {
    throw new Error('Name, email, password, and roleId are required');
  }

  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const role = await userRepository.findRoleById(BigInt(roleId));
  if (!role) {
    throw new Error('Role not found');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await userRepository.createUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    roleId: BigInt(roleId),
  });

  return formatUserResponse(newUser);
};

const updateUser = async (id, { name, email, password, roleId }) => {
  const user = await userRepository.findUserById(BigInt(id));
  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }

  const data = {};

  if (name && name.trim() !== '') {
    data.name = name.trim();
  }

  if (email && email.trim() !== '') {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existingUser = await userRepository.findUserByEmail(normalizedEmail);
      if (existingUser && existingUser.id !== user.id) {
        throw new Error('Email already in use');
      }
      data.email = normalizedEmail;
    }
  }

  if (roleId) {
    const role = await userRepository.findRoleById(BigInt(roleId));
    if (!role) {
      throw new Error('Role not found');
    }
    data.roleId = BigInt(roleId);
  }

  if (password && password.trim() !== '') {
    data.password = await hashPassword(password);
  }

  const updatedUser = await userRepository.updateUser(BigInt(id), data);
  return formatUserResponse(updatedUser);
};

const deleteUser = async (id, currentUserId) => {
  if (id.toString() === currentUserId.toString()) {
    throw new Error('Cannot delete your own account');
  }

  const user = await userRepository.findUserById(BigInt(id));
  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }

  await userRepository.softDeleteUser(BigInt(id));
  return { message: 'User deleted successfully' };
};

const getRoles = async () => {
  const roles = await userRepository.findAllRoles();
  return roles.map((role) => ({
    id: role.id.toString(),
    name: role.name,
    description: role.description,
  }));
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
};
