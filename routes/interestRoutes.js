
const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");

router.post('/add', interestController.addInterest);
router.get('/get', interestController.getInterests);

module.exports = router;