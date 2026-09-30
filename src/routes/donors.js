'use strict';
const router = require('express').Router();
const donorService = require('../services/donorService');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateDonor } = require('../utils/validators');

router.use(authenticate);

router.get('/', (req, res) => {
  const { q, type } = req.query;
  res.json({ donors: donorService.list(req.user, { q, type }) });
});

router.get('/:id', (req, res) => res.json({ donor: donorService.getById(req.params.id, req.user) }));

router.post('/', validate(validateDonor), (req, res) =>
  res.status(201).json({ donor: donorService.create(req.body, req.user) }));

router.put('/:id', validate(validateDonor, { partial: true }), (req, res) =>
  res.json({ donor: donorService.update(req.params.id, req.body, req.user) }));

router.delete('/:id', authorize('admin'), (req, res) => {
  donorService.remove(req.params.id);
  res.status(204).end();
});

module.exports = router;
