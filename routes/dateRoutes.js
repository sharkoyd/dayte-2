const express = require('express');

const auth = require('../middleware/auth');
const dateController = require('../controllers/dateController');

const router = express.Router();

// like a recommended user
router.post('/like', auth, dateController.like);

module.exports = router;