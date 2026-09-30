'use strict';
const router = require('express').Router();
const userService = require('../services/userService');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRole } = require('../utils/validators');
const { AppError } = require('../utils/errors');

router.use(authenticate, authorize('admin'));

router.get('/', (req, res) => res.json({ users: userService.listUsers() }));

router.patch('/:id/role', (req, res) => {
  const errors = validateRole(req.body.role);
  if (errors.length) throw new AppError(400, 'Datos inválidos', errors);
  if (req.params.id === req.user.id) throw new AppError(400, 'No puedes cambiar tu propio rol');
  res.json({ user: userService.updateRole(req.params.id, req.body.role) });
});

module.exports = router;
