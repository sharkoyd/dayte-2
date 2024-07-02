const express = require('express');
const recommendationController = require('../controllers/recommendation');
const auth = require('../middleware/auth');
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");
const profileFinished = require("../middleware/profileFinished");


const router = express.Router();

// Route to create a new recommendation
router.post('/generate',auth,verifiedPhoneNumber,profileFinished,recommendationController.createRecommendation);

// Route to get all recommendations
router.get('/',auth,verifiedPhoneNumber, recommendationController.getRecommendations);

module.exports = router;