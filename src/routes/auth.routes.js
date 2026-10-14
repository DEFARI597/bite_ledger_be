const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimiter.middleware");

const router = express.Router();

router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
