const express = require('express');
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");

const auth = require('../middleware/auth');
const dateController = require('../controllers/dateController');

const router = express.Router();

// like a recommended user
router.post('/like', auth, dateController.like);
router.get('/matches', auth, dateController.getUserMatches);
router.post('/setProposedDate', auth, dateController.setProposedDate);
router.post('/cancelDate', auth, dateController.cancelDate);
module.exports = router;