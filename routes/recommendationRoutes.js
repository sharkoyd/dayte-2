const express = require('express');
const recommendationController = require('../controllers/recommendation');
const auth = require('../middleware/auth');
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");
const profileFinished = require("../middleware/profileFinished");


const router = express.Router();

// Route to create a new recommendation
router.get('/get',auth,verifiedPhoneNumber,profileFinished,recommendationController.getRecommendations);

// Route to get all recommendations
router.post('/shuffle',auth,verifiedPhoneNumber, recommendationController.shuffleRecommendations);

module.exports = router;