const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error("FATAL ERROR: ADMIN_PASSWORD environment variable is missing.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts from this IP, please try again after 15 minutes.",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

const allowedOrigins = [
  'https://ach.mohandl3g.ly',
  'https://ach.mohandl3g.ddnsgeek.com',
  'http://internal.docker',
  'http://192.168.0.100',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:5000',
];

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

module.exports = { PORT, loginLimiter, apiLimiter, allowedOrigins, ADMIN_USERNAME };
