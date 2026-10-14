const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const isSha256 = (str) => typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str);

const hashPassword = async (password) => {
  const normalized = isSha256(password)
    ? password.toLowerCase()
    : crypto.createHash('sha256').update(password).digest('hex');

  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(normalized, salt);
};

const comparePassword = async (password, hashedPassword) => {
  const directMatch = await bcrypt.compare(password, hashedPassword);
  if (directMatch) return true;

  const sha = crypto.createHash('sha256').update(password).digest('hex');
  const shaMatch = await bcrypt.compare(sha, hashedPassword);
  if (shaMatch) return true;

  return false;
};

module.exports = {
  hashPassword,
  comparePassword
};
