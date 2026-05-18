const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginLimiter } = require('../config');
const { validate, loginSchema } = require('../middleware/validate');

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  const isMatch = username === process.env.ADMIN_USERNAME
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD)
    : await bcrypt.compare(password, process.env.ADMIN_PASSWORD);

  if (!isMatch || username !== process.env.ADMIN_USERNAME) {
    return res.status(401).send('Invalid Credentials');
  }

  const user = { name: username };
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ accessToken });
});

module.exports = router;
