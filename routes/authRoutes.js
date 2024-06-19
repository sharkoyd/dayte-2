const express = require('express');
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', UserController.register);

// Login a user
router.post('/login', UserController.login);

// Get the profile of the logged in user
router.get('/profile', auth, UserController.getProfile);

module.exports = router;