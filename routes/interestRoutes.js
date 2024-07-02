
const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");

router.post('/add', interestController.addInterest);

module.exports = router;