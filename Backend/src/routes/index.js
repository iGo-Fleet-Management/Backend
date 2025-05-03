const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const forgotPasswordRoutes = require('./forgotPasswordRoutes');
const tripRoutes = require('./tripRoutes');
const stopRoutes = require('./stopRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/auth', forgotPasswordRoutes);

router.use('/profile', profileRoutes);

router.use('/trips', tripRoutes);

router.use('/stops', stopRoutes);

router.use('/users', userRoutes);

router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

module.exports = router;
