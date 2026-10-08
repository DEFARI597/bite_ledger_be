const userRepository = require('../repositories/user.repository');
const { comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');

const login = async (email, password) => {
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const roleName = user.role ? user.role.name : null;
  const permissions = user.role && user.role.permissions
    ? user.role.permissions.map(p => p.permission.name)
    : [];

  const payload = {
    sub: user.id.toString(),
    email: user.email,
    role: roleName
  };

  const accessToken = generateToken(payload);

  const userResponse = {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: roleName,
    permissions
  };

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 28800,
    user: userResponse
  };
};

module.exports = {
  login
};
