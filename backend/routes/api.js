const express = require('express');
const router = express.Router();
const { signup, login, getMe, logout, updateProfile, changePassword } = require('../controllers/authController');
const { getBalance, getHistory, spinWheel, spendCredits, grantCredits } = require('../controllers/creditsController');
const { protect, adminOnly } = require('../middleware/auth');

// AUTH ROUTES
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

// CREDITS ROUTES
router.get('/credits/balance', protect, getBalance);
router.get('/credits/history', protect, getHistory);
router.post('/credits/spin-wheel', protect, spinWheel);
router.post('/credits/spend', protect, spendCredits);
router.post('/credits/grant', protect, adminOnly, grantCredits);

module.exports = router;
