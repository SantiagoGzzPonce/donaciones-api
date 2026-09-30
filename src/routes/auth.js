'use strict';
const router = require('express').Router();
const userService = require('../services/userService');
const { signToken, authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateRegister, validateLogin } = require('../utils/validators');
const { asyncHandler } = require('../utils/errors');

// El registro público siempre crea rol "usuario"; el rol enviado por el cliente se ignora.
router.post('/register', validate(validateRegister), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await userService.createUser({ name, email, password });
  res.status(201).json({ user, token: signToken(user) });
}));

router.post('/login', validate(validateLogin), asyncHandler(async (req, res) => {
  const user = await userService.verifyCredentials(req.body.email, req.body.password);
  res.json({ user, token: signToken(user) });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
