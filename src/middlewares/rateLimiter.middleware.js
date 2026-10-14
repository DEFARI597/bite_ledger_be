const { rateLimit } = require('express-rate-limit');
const { sendError } = require('../utils/response.util');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.',
      429
    );
  }
});

module.exports = {
  authLimiter
};
