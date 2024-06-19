
const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');

router.post('/add', interestController.addInterest);

module.exports = router;